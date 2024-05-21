/**
 * @param {*} elementOrSelector Elemento HTML o selector del elemento.
 * @param {string} eventName Nombre qualificado del evento.
 * @returns 
 */
function trigger(elementOrSelector,eventName)
{
    if (!elementOrSelector) return;

    const element = (typeof elementOrSelector === "string") ? document.querySelector(elementOrSelector) : elementOrSelector;
    const event = new Event(eventName);
    element.dispatchEvent(event);
}

function path_concat(p1,p2,...px)
{
    p1 = p1.toString().replaceAll("\\","/");
    p2 = p2.toString().replaceAll("\\","/");

    let l1 = p1.split("/");
    let l2 = p2.split("/");
    
    let path = [...l1, ...l2];

    for (let i = 0; i < px.length; i++) {
        const p = px[i].toString().replaceAll("\\","/");
        let l = p.split("/");
        path = path.concat(l);
    }

    return path.join("/").replace(/\/+/g, '/');
}

function url_encode(url)
{
    let _url = btoa(url);
    
    _url = _url.replaceAll("=","|");
    _url = _url.replaceAll("/","_");
    _url = _url.replaceAll("+","-");
    
    return _url;
}

function url_decode(url)
{
    url = url.replaceAll("|","=");
    url = url.replaceAll("_","/");
    url = url.replaceAll("-","+");
    
    return atob(url);
}

function readonlyControls(elementsId=[], value=true)
{
    elementsId.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if ("readonly" in el) el.readonly = value;
            else
            {
                el.style.pointerEvents = (value) ? "none" : "";
                el.style.backgroundColor = (value) ? "rgb(233, 236, 239)" : "";
                el.style.opacity = (value) ? "1" : "";
            }
        }
    });
}

function disableControls(elementsId=[], value=true)
{
    elementsId.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if ("disabled" in el) el.disabled = value;
            else el.setAttribute("disabled",value);
        }
    });
}

function hideControls(elementsId=[], value=true)
{
    elementsId.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if ("hidden" in el) el.hidden = value;
            else el.style.display = (value) ? "none" : "";
        }
    });
}

function fillSelect(id, kf, vf, url, params={}, fo={}, callback=null)
{
    const select = document.getElementById(id);

    let endpoint = InduxsoftCrudlModel.UrlReplace(url,params);
    let selected = select.value ?? "";

    fetch(endpoint).then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            return;
        }
        
        select.innerHTML = "";

        if (Object.keys(fo).length >= 2) data.unshift(fo);

        data.forEach(obj => {
            const option = document.createElement("option");
            option.value = obj[kf];
            option.text = obj[vf];
            if (obj[kf] === selected) option.selected = true;
            if (callback) callback(option,obj);

            select.appendChild(option);
        });
    })
    .catch(error => console.error(error));
}

function bsModal(id)
{
    const modal = document.getElementById(id);
    let instance = bootstrap.Modal.getInstance(modal);
    if (!instance) instance = new bootstrap.Modal(modal);
    return instance;
}
function showModal(id) { bsModal(id).show() }
function closeModal(id) { bsModal(id).hide() }

/**
 * @param {string} selector selector del contenedor de la alerta.
 * @param {string} content contenido HTML de la alerta.
 * @param {number} timeout cantidad en segundos en la que sera visible la alerta.
 * @returns 
 */
function show_alert(selector,content,timeout)
{
    const alert = document.querySelector(selector);
    if (!alert) return;
    if (!content) return;
    
    alert.classList.remove("d-none");
    alert.innerHTML = content;

    setTimeout(function() {
        alert.classList.add("d-none");
        alert.innerHTML = "";
    }, (timeout * 1000));
}
