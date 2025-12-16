document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BLOQUE 1 – RESUMEN DE DEUDAS A CANCELAR
    ===================================================== */

    const tabla = document.querySelector("#bloque-deudas table");
    if (!tabla) return;

    const checkboxes = tabla.querySelectorAll(".chk-celda");
    const resumenBody = document.getElementById("resumen-body");
    const totalSpan = document.getElementById("total-pagar");

    // Checks que deben arrancar activos
    const checksIniciales = [
        { concepto: "PP 0031273430 BNA", columna: "PP - Total" },
        { concepto: "PP GALICIA", columna: "PP - Total" },

        { concepto: "TC VISA BNA", columna: "TC - Pago Mínimo" },
        { concepto: "TC NATIVA MC BNA", columna: "TC - Pago Mínimo" },
        { concepto: "TC MASTER GAL", columna: "TC - Pago Mínimo" },
        { concepto: "TC AMEX GAL", columna: "TC - Pago Mínimo" },
        { concepto: "TC BBANK", columna: "TC - Pago Mínimo" },
        { concepto: "TC BBANK", columna: "TC - Resto de Saldo" }
    ];

    // Mapeo de columnas
    const headers = Array.from(tabla.querySelectorAll("thead th"))
        .map(th => th.textContent.trim());

    // Activar checks iniciales (MATCH FLEXIBLE)
    checksIniciales.forEach(cfg => {
        const filas = Array.from(tabla.querySelectorAll("tbody tr"));

        const fila = filas.find(tr =>
            tr.querySelector("td").textContent
                .toUpperCase()
                .includes(cfg.concepto.toUpperCase())
        );

        if (!fila) return;

        const colIndex = headers.indexOf(cfg.columna);
        if (colIndex === -1) return;

        const celda = fila.children[colIndex];
        const checkbox = celda.querySelector(".chk-celda");

        if (checkbox) checkbox.checked = true;
    });

    function actualizarResumen() {
        resumenBody.innerHTML = "";
        let total = 0;

        checkboxes.forEach(chk => {
            if (!chk.checked) return;

            const celda = chk.closest("td");
            const fila = chk.closest("tr");

            const concepto = fila.querySelector("td").textContent.trim();
            const colIndex = Array.from(fila.children).indexOf(celda);
            const tipo = headers[colIndex];

            const valor = parseFloat(celda.dataset.valor) || 0;
            if (valor <= 0) return;

            total += valor;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${concepto} – ${tipo}</td>
                <td>$ ${valor.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            `;
            resumenBody.appendChild(tr);
        });

        totalSpan.textContent =
            `$ ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    }

    checkboxes.forEach(chk =>
        chk.addEventListener("change", actualizarResumen)
    );

    actualizarResumen();


    /* =====================================================
       BLOQUE 2 – CRONOGRAMA DE PAGOS USD
    ===================================================== */

    const tbody = document.getElementById("plan-usd-body");
    if (!tbody) return;

    const meses = [
        "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE",
        "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
        "ENERO", "FEBRERO"
    ];

    const totalDeudaUSD = 28000;
    const cuotas = 25;

    let saldo = totalDeudaUSD;
    let tipoCambio = 1535.39;

    const pagosExtraGon = {
        5: 1062.18,
        8: 700,
        9: 1000,
        10: 1051.30,
        17: 1036.24,
        20: 700,
        21: 1000,
        22: 1025.60,
        25: 187.13
    };

    for (let i = 1; i <= cuotas; i++) {

        const mes = meses[(i - 1) % 12];
        const año = 2026 + Math.floor((i - 1) / 12);

        const pagoExtra = pagosExtraGon[i] || 0;

        let pagoBrico = 800;
        if (mes === "JULIO" || mes === "DICIEMBRE") pagoBrico = 1000;
        if (i === 25) pagoBrico = 824.68;

        const totalPagoUSD = pagoExtra + pagoBrico;

        saldo -= totalPagoUSD;
        if (saldo < 0) saldo = 0;

        const pagoARS = totalPagoUSD * tipoCambio;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i}</td>
            <td>${mes}</td>
            <td>${año}</td>
            <td>USD ${pagoExtra.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td>USD ${pagoBrico.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td><strong>USD ${totalPagoUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></td>
            <td>USD ${saldo.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td>$ ${tipoCambio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td>$ ${pagoARS.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        `;

        tbody.appendChild(tr);

        tipoCambio *= 1.022; // +2.2% mensual
    }

});
