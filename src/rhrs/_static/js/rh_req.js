var reqper =
{
    formId:"", form:null, tableId:"", table:null,
    url_exit:"",
    error_timeout:7,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.table = document.getElementById(this.tableId);
        const btn_guardar = document.getElementById("btn_guardar");
        const btn_aprobar = document.getElementById("btn_aprobar");
        const btn_cancelar = document.getElementById("btn_cancelar");

        btn_guardar.addEventListener("click", () => this.submit());
        if (btn_aprobar) btn_aprobar.addEventListener("click", () => this.changeStatus(btn_aprobar));
        if (btn_cancelar) btn_cancelar.addEventListener("click", () => this.changeStatus(btn_cancelar));

        this.setKeyboardShortcuts();
        this.setEventTable();
    },

    setKeyboardShortcuts()
    {
        document.addEventListener("keydown", (e) => {
            // console.log("key: "+ e.key + " | " + "code: " + e.code);
            if (e.key === "Escape") {
                e.preventDefault();
                (this.url_exit !== "")
                    ? window.location.href = this.url_exit
                    : window.location.href = "../";
            }
            if (e.key === "F5") {
                e.preventDefault();
                window.location.reload();
            }
        });
    },

    setEventTable()
    {
        if (!this.table) return;

        const evt = this.table.EdiTable.Const.Events;
        const ik_puesto = document.getElementById("ik_puesto");
        const btn_add_row = document.getElementById("btn_add_row");
        const btn_del_row = document.getElementById("btn_del_row");

        this.table.setInputKey("dpuesto",ik_puesto);

        btn_add_row.addEventListener("click", () => ik_puesto.searchText("",false));
        btn_del_row.addEventListener("click", () => this.table.DeleteCurrentRow());
        ik_puesto.change_event = (data) => this.agregarPuesto(data);

        this.table.Events[evt.BeforeUpdateCell] = (e) =>
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let data_row = this.table?.DataArray[curr_row] ?? {};
            let field = e.coldef.field;

            if (field === "cant_solicitada" && Number(e.text.trim()) <= 0) {
                show_alert("#tbl_alerts","El valor debe ser mayor que 0.",3);
                e.cancel = true;
                return false;
            }
        };

        this.table.Events[evt.ConfirmEdition] = (e) =>
        {
            // code...
        };
    },

    submit()
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;

        let _detalle = this.filterDataArray(this.table);
        
        let fd = new FormData(this.form);
        fd.append("_detalle",JSON.stringify(_detalle));

        let endpoint = "./";
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                return;
            }

            window.location.href = data.url_redir;
        }

        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, this.error_timeout);
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    changeStatus(relbtn)
    {
        let ff = this.form.elements;

        let fd = new FormData();
        fd.append("sys_pk",Number(ff["sys_pk"].value));
        fd.append("sys_recver",Number(ff["sys_recver"].value));
        fd.append("status",Number(relbtn.getAttribute("data-status")));
        
        let endpoint = "./?_act=change-status";
        let method = "PATCH";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                return;
            }

            window.location.href = data.url_redir;
        }
        
        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, this.error_timeout);
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    filterDataArray(edt) {
        if (!edt) return [];
        return (edt?.DataArray??[]).filter((row) => { return Object.keys(row??{}).length >= edt.Columns.length })
    },

    agregarPuesto(data)
    {
        if (!data) return;

        let req_det =
        {
            dpuesto: data.descripcion,
            dunidad: data.unidad_org,
            ref_puesto: data.sys_pk,
            cant_solicitada: 0,
            cant_aprobada: 0,
            cant_contratada: 0,
            notas: "",
        }

        let _detalle = this.filterDataArray(this.table);
        let available_row = (_detalle.length > 0) ? _detalle.length : 0;

        if (this.table.DataArray.length === _detalle.length) this.table.AddRow();

        this.table.DataArray[available_row] = req_det;
        this.table.UpdateRow(available_row);
    },
}