var reqper =
{
    formId:"", form:null, tableId:"", table:null, _GET:{},
    url_exit:"",
    is_new:false, cur_status:0, error_timeout:7,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.table = document.getElementById(this.tableId);
        this.is_new = (this._GET["_entity_id"] === "_new");
        const btn_guardar = document.getElementById("btn_guardar");
        const btn_aprobar = document.getElementById("btn_aprobar");
        const btn_cancelar = document.getElementById("btn_cancelar");

        if (btn_guardar) btn_guardar.addEventListener("click", () => this.submit(btn_guardar));
        if (btn_aprobar) btn_aprobar.addEventListener("click", () => this.submit(btn_aprobar));
        if (btn_cancelar) btn_cancelar.addEventListener("click", () => this.changeStatus(btn_cancelar));

        this.setKeyboardShortcuts();
        this.setEventTable();

        if (this._GET["_act"] === "aprobar") this.coloringNoEditableCells();
        if (this._GET["_act"] === "cancelar" && this.cur_status === 2) this.changeStatus(btn_cancelar);
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

        if (btn_add_row) btn_add_row.addEventListener("click", () => ik_puesto.searchText("",false));
        if (btn_del_row) btn_del_row.addEventListener("click", () => this.table.DeleteCurrentRow());
        if (ik_puesto) ik_puesto.change_event = (data) => this.agregarPuesto(data);

        this.table.Events[evt.BeforeUpdateCell] = (e) =>
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let data_row = this.table?.DataArray[curr_row] ?? {};
            let field = e.coldef.field;

            if ((field === "cant_solicitada" || field === "cant_aprobada") && Number(e.text.trim()) <= 0) {
                show_alert("#tbl_alerts","El valor debe ser mayor que 0.",3);
                e.cancel = true;
                return false;
            }

            if (field === "cant_aprobada" && Number(e.text.trim()) > Number(data_row["cant_solicitada"])) {
                show_alert("#tbl_alerts","La cantidad aprobada no puede ser mayor que la cantidad solicitada.",3);
                e.cancel = true;
                return false;
            }
        };

        this.table.Events[evt.ConfirmEdition] = (e) =>
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let data_row = this.table?.DataArray[curr_row] ?? {};
            let field = e.coldef.field;

            if (field === "cant_solicitada")
            {
                data_row["cant_aprobada"] = Number(e.text.trim());
                this.table.UpdateRow(curr_row);
            }
        };
    },

    submit(relbtn)
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;

        let _detalle = this.filterDataArray(this.table);
        let new_status = Number(relbtn.getAttribute("data-status"));
        
        let fd = new FormData(this.form);
        fd.append("ref_status",new_status);
        fd.append("_detalle",JSON.stringify(_detalle));

        let endpoint = "./";
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                return;
            }

            alert("Información guardada");
            window.location.href = this.url_exit;
            // window.location.href = data.url_redir;
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

    coloringNoEditableCells()
    {
        let array = this.table?.DataArray ?? [];
        for (let i = 0; i < array.length; i++) {
            if (Object.keys(array[i]).length < this.table.Columns.length) continue;

            const tr = this.table.GetTrByIndex(i);
            tr.querySelectorAll("td").forEach(td => {
                const coldef = this.table.GetColumnDefOfTd(td);
                
                if (coldef.type === "NoEditable")
                {
                    td.style.backgroundColor = "rgb(233, 236, 239)";
                    td.style.color = "#000000";
                    td.style.opacity = "1";
                }
            });
        }
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