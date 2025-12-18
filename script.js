const ESTADO_REPROGRAMACION = {
    bna: null,
    galicia: null
};


function limpiarMonto(valor){
    if(!valor) return 0;

    return parseFloat(
        valor
            .replace(/\$/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
    ) || 0;
}

function formatearARS(numero){
    return "$ " + numero.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

/* =========================
   RESUMEN PRÉSTAMO FAMILIAR
========================= */
const tablaCancelaciones = document.getElementById("tabla-cancelaciones");
const totalPrestamo = document.getElementById("total-prestamo");

function actualizarResumen(){
    let total = 0;
    tablaCancelaciones.innerHTML = "";

    /* =========================
       PRÉSTAMOS
    ========================= */
    document.querySelectorAll(".check-prestamo:checked").forEach(check => {
        const fila = check.closest("tr");
        const nombre = fila.querySelector(".nombre-deuda").textContent;
        const monto = parseFloat(fila.dataset.monto);

        total += monto;

        tablaCancelaciones.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${nombre}</td>
                <td>${formatearARS(monto)}</td>
            </tr>
        `);
    });

    /* =========================
       TARJETAS
    ========================= */
    document.querySelectorAll(".pago-input").forEach(input => {
        const fila = input.closest("tr");
        const totalTarjeta = parseFloat(
            fila.querySelector(".total-tarjeta").dataset.total
        );

        let pago = limpiarMonto(input.value);
        if (pago > totalTarjeta) pago = totalTarjeta;
        if (pago < 0) pago = 0;

        /* =========================
           SALDO RESTANTE (UI)
        ========================= */
        const restante = totalTarjeta - pago;
        fila.querySelector(".saldo-restante").textContent =
            formatearARS(restante);

        input.value = pago === 0 ? "" : formatearARS(pago);

        if(pago <= 0) return;

        const nombre = fila.querySelector(".nombre-deuda").textContent;
        let montoFinal = pago;

        /* =========================
           BRUBANK – DESCUENTO
        ========================= */
        if(
            fila.dataset.banco === "brubank" &&
            pago === totalTarjeta
        ){
            const descuento = totalTarjeta * 0.15;
            montoFinal = totalTarjeta - descuento;

            tablaCancelaciones.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${nombre}</td>
                    <td>${formatearARS(totalTarjeta)}</td>
                </tr>
                <tr class="descuento">
                    <td>Descuento Brubank 15%</td>
                    <td>- ${formatearARS(descuento)}</td>
                </tr>
                <tr class="total-final">
                    <td><strong>Total a cancelar</strong></td>
                    <td><strong>${formatearARS(montoFinal)}</strong></td>
                </tr>
            `);

            total += montoFinal;
            return;
        }

        /* =========================
           TARJETAS SIN DESCUENTO
        ========================= */
        total += montoFinal;

        tablaCancelaciones.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${nombre}</td>
                <td>${formatearARS(montoFinal)}</td>
            </tr>
        `);
    });

    /* =========================
       PLACEHOLDER
    ========================= */
    if(tablaCancelaciones.children.length === 0){
        tablaCancelaciones.innerHTML = `
            <tr class="placeholder">
                <td colspan="2">Seleccioná deudas para cancelar</td>
            </tr>
        `;
    }

    totalPrestamo.textContent = formatearARS(total);
}

/* =========================
   EVENTOS
========================= */
document
    .querySelectorAll(".check-prestamo")
    .forEach(check =>
        check.addEventListener("change", actualizarResumen)
    );

document
    .querySelectorAll(".pago-input")
    .forEach(input =>
        input.addEventListener("input", actualizarResumen)
    );













/* =========================
   SIMULACIÓN RECIBO – FINAL DEFINITIVO
========================= */

/* ===== SALDO BASE ===== */
const SALDO_BASE_RECIBO = 591225.22;

/* ===== BASE RECIBO ===== */
const RECIBO_BASE = {
    ingresos: 3068000 + 200000 + 150000,

    descuentosFijos: 152000 + 400000 + 220000 + 95000 + 450000,

    bnaTotal: 521985.89,
    galicia: 680000,
    ansesTotal: 97000,
    brico1: 110424.61,
    brico2: 100364.28
};

/* ===== CUOTAS ===== */
const CUOTAS = {
    "PP BRICO 1": 110424.61,
    "PP BRICO 2": 100364.28,
    "PP BRICO ANSES": 48500,
    "PP GON ANSES": 48500,
    "PP 0014456613 BNA": 4960.47,
    "PP 0018854563 BNA": 7109.77,
    "PP 0031273430 BNA": 297575.14,
    "PP 0034000838 BNA": 224410.75,
    "PP GALICIA": 680000
};

/* ===== UTIL ===== */
function setValor(id, valor){
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = `${valor < 0 ? "-" : ""}$ ${Math.abs(valor).toLocaleString("es-AR")}`;
    el.classList.remove("positivo","negativo");
    el.classList.add(valor < 0 ? "negativo" : "positivo");
}

/* =====================================================
   LÓGICA PRINCIPAL
===================================================== */
function actualizarReciboSimulado(){

    let bna = RECIBO_BASE.bnaTotal;
    let galicia = RECIBO_BASE.galicia;
    let anses = RECIBO_BASE.ansesTotal;
    let brico1 = RECIBO_BASE.brico1;
    let brico2 = RECIBO_BASE.brico2;

    /* ===== CANCELACIONES ===== */
    document.querySelectorAll(".check-prestamo:checked").forEach(check => {

        const nombre = check.closest("tr")
            .querySelector(".nombre-deuda")
            .textContent.trim();

        if (nombre.includes("BNA") && CUOTAS[nombre]) {
            bna -= CUOTAS[nombre];
        }

        if (nombre === "PP GALICIA") galicia = 0;

        if (nombre === "PP BRICO ANSES") anses -= CUOTAS[nombre];
        if (nombre === "PP GON ANSES") anses -= CUOTAS[nombre];

        if (nombre === "PP BRICO 1") brico1 = 0;
        if (nombre === "PP BRICO 2") brico2 = 0;
    });

    bna = Math.max(0, bna);
    galicia = Math.max(0, galicia);
    anses = Math.max(0, anses);

    /* ===== REFINANCIACIONES (DESDE OTRO SCRIPT) ===== */
    const refiBNA = window.refiBNA || 0;
    const refiGalicia = window.refiGalicia || 0;

    /* ===== UI ===== */
    setValor("recibo-bna", -(bna + refiBNA));
    setValor("recibo-galicia", -(galicia + refiGalicia));
    setValor("recibo-anses", -anses);
    setValor("recibo-brico1", -brico1);
    setValor("recibo-brico2", -brico2);

    setValor("recibo-refi-bna", -refiBNA);
    setValor("recibo-refi-galicia", -refiGalicia);

    /* ===== EGRESOS (ACÁ ESTABA EL ERROR) ===== */
    const egresos =
        RECIBO_BASE.descuentosFijos +
        bna +
        galicia +
        anses +
        brico1 +
        brico2 +
        refiBNA +
        refiGalicia;

    const saldoFinal = RECIBO_BASE.ingresos - egresos;

    setValor("saldo-simulado", saldoFinal);

    const diferencia = saldoFinal - SALDO_BASE_RECIBO;
    setValor("diferencia-liberada", diferencia);
}

/* ===== EVENTOS ===== */
document
    .querySelectorAll(".check-prestamo")
    .forEach(c => c.addEventListener("change", actualizarReciboSimulado));

actualizarReciboSimulado();












































/* =====================================================
   TOTAL A PRESTAR + CRONOGRAMA DE PAGOS (AJUSTADO)
===================================================== */

/* ===== UTILIDADES ===== */
function limpiarMontoARS(texto){
    return parseFloat(
        texto
            .replace(/\$/g,"")
            .replace(/\./g,"")
            .replace(",",".")
    ) || 0;
}

function formatearUSD(v){
    return `USD ${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatearARS(v){
    return `$ ${v.toLocaleString("es-AR")}`;
}

/* ===== ELEMENTOS ===== */
const totalARS = document.getElementById("total-prestamo");
const totalPrestarARS = document.getElementById("total-prestar-ars");
const totalPrestarUSD = document.getElementById("total-prestar-usd");
const inputTC = document.getElementById("tipo-cambio");
const tablaCronograma = document.querySelector("#cronograma-pagos tbody");

/* ===== TOTAL A PRESTAR ===== */
function actualizarTotalPrestar(){

    const ars = limpiarMontoARS(totalARS.textContent);
    totalPrestarARS.textContent = formatearARS(ars);

    const tc = parseFloat(inputTC.value);
    if(!tc || tc <= 0){
        totalPrestarUSD.textContent = "USD 0";
        tablaCronograma.innerHTML = "";
        return;
    }

    const usd = ars / tc;
    totalPrestarUSD.textContent = formatearUSD(usd);

    generarCronograma(usd, tc);
}

/* ===== PAGOS BASE ===== */
function pagoGon(mes){
    if(mes === 0) return 1000;
    if(mes === 6) return 1000;
    if(mes === 10) return 700;
    if(mes === 11) return 1000;
    return 0;
}

function pagoBrico(mes){
    if(mes === 0 || mes === 6) return 1000;
    return 800;
}

/* ===== SALDO DISPONIBLE DEL RECIBO ===== */
function obtenerSaldoDisponibleUSD(tc){
    const el = document.getElementById("saldo-simulado");
    if(!el) return 0;

    const ars = limpiarMontoARS(el.textContent);
    if(ars <= 0) return 0;

    return (ars / tc) * 0.8;
}

/* ===== CRONOGRAMA ===== */
function generarCronograma(saldoInicialUSD, tcInicial){

    tablaCronograma.innerHTML = "";

    let saldo = saldoInicialUSD;
    let cuota = 1;

    let mes = 3; // Abril
    let anio = 2026;

    let tc = tcInicial;

    const nombresMes = [
        "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
        "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
    ];

    while(saldo > 0){

        const gonBase = pagoGon(mes);
        const brico = pagoBrico(mes);

        /* === SALDO DISPONIBLE DEL RECIBO === */
        const extraGon = obtenerSaldoDisponibleUSD(tc);

        let gon = gonBase + extraGon;
        let totalUSD = gon + brico;

        /* === AJUSTE ÚLTIMA CUOTA === */
        if(totalUSD > saldo){
            const factor = saldo / totalUSD;
            gon *= factor;
            totalUSD = saldo;
        }

        saldo -= totalUSD;
        if(saldo < 0) saldo = 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cuota}</td>
            <td>${nombresMes[mes]}</td>
            <td>${anio}</td>
            <td>${formatearUSD(gon)}</td>
            <td>${formatearUSD(brico)}</td>
            <td>${formatearUSD(totalUSD)}</td>
            <td>${formatearUSD(saldo)}</td>
            <td>${tc.toFixed(2)}</td>
            <td>${formatearARS(totalUSD * tc)}</td>
        `;

        tablaCronograma.appendChild(tr);

        /* === AVANZAR === */
        cuota++;
        mes++;
        if(mes === 12){
            mes = 0;
            anio++;
        }

        /* === DEVALUACIÓN === */
        tc *= 1.018;

        if(cuota > 360) break;
    }
}

/* ===== EVENTOS ===== */
inputTC.addEventListener("input", actualizarTotalPrestar);

const observer = new MutationObserver(actualizarTotalPrestar);
observer.observe(totalARS, { childList:true, subtree:true });

actualizarTotalPrestar();
















































/* =====================================================
   REPROGRAMACIÓN DE SALDOS – DESGLOSE REAL
===================================================== */

/* ===== UTILIDADES ===== */
function parseARS(texto){
    return parseFloat(
        texto.replace(/\$/g,"")
             .replace(/\./g,"")
             .replace(",",".")
             .trim()
    ) || 0;
}

function formatearARS(valor){
    return `$ ${valor.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

/* ===== SISTEMA FRANCÉS ===== */
function cuotaFrancesa(monto, tasaMensual, cuotas){
    return monto * (tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas)));
}

/* ===== OBTENER SALDOS ===== */
function obtenerSaldosPendientes(){

    let bna = 0;
    let galicia = 0;
    let brubank = 0;

    document.querySelectorAll(".bloque-deuda table tbody tr").forEach(fila => {

        const nombre = fila.querySelector(".nombre-deuda")?.textContent.trim();
        const saldoEl = fila.querySelector(".saldo-restante");
        if(!nombre || !saldoEl) return;

        const saldo = parseARS(saldoEl.textContent);
        if(saldo <= 0) return;

        if(nombre === "TC VISA BNA" || nombre === "TC NATIVA MC BNA"){
            bna += saldo;
        }

        if(nombre === "TC MASTER GAL" || nombre === "TC AMEX GAL"){
            galicia += saldo;
        }

        if(nombre === "TC BBANK"){
            brubank += saldo;
        }
    });

    return { bna, galicia, brubank };
}

/* =====================================================
   BANCO NACIÓN
===================================================== */
function calcularBNA(capital){

    const cuotas = 60;
    const tasaMensual = (0.32 + 0.02) / 12;

    const cuotaSinIVA = cuotaFrancesa(capital, tasaMensual, cuotas);

    const interes = capital * tasaMensual;
    const capitalCuota = cuotaSinIVA - interes;
    const iva = interes * 0.21;

    return {
        cuotaTotal: cuotaSinIVA + iva,
        capital: capitalCuota,
        interes,
        iva
    };
}

/* =====================================================
   GALICIA UVA
===================================================== */
function calcularGalicia(capitalARS){

    const UVA = 1690;
    const cuotas = 72;
    const tasaMensual = 0.085 / 12;

    const capitalUVA = capitalARS / UVA;
    const cuotaUVA = cuotaFrancesa(capitalUVA, tasaMensual, cuotas);

    const interesUVA = capitalUVA * tasaMensual;
    const capitalCuotaUVA = cuotaUVA - interesUVA;
    const ivaUVA = interesUVA * 0.21;

    return {
        cuotaARS: (cuotaUVA + ivaUVA) * UVA,
        capitalARS: capitalCuotaUVA * UVA,
        interesARS: interesUVA * UVA,
        ivaARS: ivaUVA * UVA
    };
}

/* =====================================================
   ACTUALIZAR UI + CONEXIÓN RECIBO
===================================================== */
function actualizarReprogramacion(){

    const { bna, galicia, brubank } = obtenerSaldosPendientes();

    /* SALDOS */
    document.getElementById("saldo-bna").textContent = formatearARS(bna);
    document.getElementById("saldo-galicia").textContent = formatearARS(galicia);
    document.getElementById("saldo-brubank").textContent = formatearARS(brubank);

    /* ===== BNA ===== */
    if(bna > 0){
        const r = calcularBNA(bna);

        window.refiBNA = r.cuotaTotal; // ✅ GLOBAL

        document.getElementById("cuota-bna").textContent = formatearARS(r.cuotaTotal);
        document.getElementById("bna-capital").textContent = formatearARS(r.capital);
        document.getElementById("bna-interes").textContent = formatearARS(r.interes);
        document.getElementById("bna-iva").textContent = formatearARS(r.iva);
    } else {
        window.refiBNA = 0;
    }

    /* ===== GALICIA ===== */
    if(galicia > 0){
        const r = calcularGalicia(galicia);

        window.refiGalicia = r.cuotaARS; // ✅ GLOBAL

        document.getElementById("cuota-galicia").textContent = formatearARS(r.cuotaARS);
        document.getElementById("gal-capital").textContent = formatearARS(r.capitalARS);
        document.getElementById("gal-interes").textContent = formatearARS(r.interesARS);
        document.getElementById("gal-iva").textContent = formatearARS(r.ivaARS);
    } else {
        window.refiGalicia = 0;
    }

    /* ===== MOSTRAR EN RECIBO ===== */
    document.getElementById("recibo-refi-bna").textContent =
        window.refiBNA > 0 ? `- ${formatearARS(window.refiBNA)}` : "- $ 0";

    document.getElementById("recibo-refi-galicia").textContent =
        window.refiGalicia > 0 ? `- ${formatearARS(window.refiGalicia)}` : "- $ 0";

    /* 🔥 AVISAR AL RECIBO */
    if (typeof actualizarReciboSimulado === "function") {
        actualizarReciboSimulado();
    }
}

/* ===== EVENTOS ===== */
document
    .querySelectorAll(".pago-input")
    .forEach(i => i.addEventListener("input", actualizarReprogramacion));

/* INIT */
actualizarReprogramacion();













