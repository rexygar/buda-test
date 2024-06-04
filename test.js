const fetch = require('node-fetch');

async function obtenerOperacionesEnRango(timestampInicio, timestampFin) {
    try {
        const response = await fetch(`https://www.buda.com/api/v2/markets/btc-clp/trades?timestamp=${timestampInicio}&timestamp=${timestampFin}`);
        const data = await response.json();

        if (data && data.trades && Array.isArray(data.trades.entries)) {
            return data.trades.entries;
        } else {
            console.error("La propiedad 'entries' no es un array o los datos de transacciones son inválidos.");
            return [];
        }
    } catch (error) {
        console.error('Error al obtener datos de transacciones:', error);
        return [];
    }
}

function calcularTotalCLP(operaciones) {
    let totalCLP = 0;

    operaciones.forEach(operacion => {
        const cantidadBTC = parseFloat(operacion[1]);
        const precioCLP = parseFloat(operacion[2]);
        const totalCLPTransaccion = cantidadBTC * precioCLP;
        totalCLP += totalCLPTransaccion;
    });

    return totalCLP;
}

(async () => {
    const timestampInicio = 1735560000000;
    const timestampFin = 1735563600000;

    const operaciones = await obtenerOperacionesEnRango(timestampInicio, timestampFin);

    const totalCLP = calcularTotalCLP(operaciones);

    console.log(`Total CLP transado durante Black Buda: ${totalCLP.toFixed(2)}`);
})();

async function obtenerVolumenBTC(timestamp) {
    try {
        const response = await fetch(`https://www.buda.com/api/v2/markets/btc-clp/trades?timestamp=${timestamp}`);
        const data = await response.json();
        let totalVolumenBTC = 0;
        data.trades.entries.forEach(operacion => {
            const cantidadBTC = parseFloat(operacion[1]);
            totalVolumenBTC += cantidadBTC;
        });
        return totalVolumenBTC;
    } catch (error) {
        console.error('Error al obtener datos de transacciones:', error);
        return 0;
    }
}

(async () => {
    const timestampHoy = new Date().getTime();
    const timestampAyer = timestampHoy - (365 * 24 * 60 * 60 * 1000);

    const volumenActualBTC = await obtenerVolumenBTC(new Date().getTime());
    const volumenAnteriorBTC = await obtenerVolumenBTC(timestampAyer);

    const aumentoPorcentual = ((volumenActualBTC - volumenAnteriorBTC) / volumenAnteriorBTC) * 100;

    console.log(`Aumento porcentual en el volumen de transacciones (en BTC): ${aumentoPorcentual.toFixed(2)}%`);
})();

async function obtenerVolumenTotalBTC(timestamp) {
    try {
        const response = await fetch(`https://www.buda.com/api/v2/markets/btc-clp/trades?timestamp=${timestamp}`);
        const data = await response.json();
        
        if (!data.trades || !Array.isArray(data.trades.entries)) {
            console.error("No se encontraron datos de transacciones válidos.");
            return 0;
        }

        let volumenTotalBTC = 0;
        data.trades.entries.forEach(operacion => {
            const cantidadBTC = parseFloat(operacion[1]);
            volumenTotalBTC += cantidadBTC;
        });
        return volumenTotalBTC;
    } catch (error) {
        console.error('Error al obtener datos de transacciones:', error);
        return 0;
    }
}

async function obtenerPrecioPromedioBTC(timestamp) {
    const maxIntentos = 3;
    let intentoActual = 0;

    while (intentoActual < maxIntentos) {
        try {
            const response = await fetch(`https://www.buda.com/api/v2/markets/btc-clp/ticker?timestamp=${timestamp}`);
            const data = await response.json();

            if (!data.ticker || !data.ticker.avg_price) {
                console.error("No se recibió el precio promedio de BTC.");
                return 0;
            }

            return parseFloat(data.ticker.avg_price);
        } catch (error) {
            console.error(`Error al obtener el precio promedio de BTC (intentos restantes: ${maxIntentos - intentoActual}):`, error);
            intentoActual++;
        }
    }

    console.error("Se agotaron los intentos de solicitud. No se pudo obtener el precio promedio de BTC.");
    return 0;
}

async function obtenerDatosTicker(startTime, endTime) {
    try {
        const response = await fetch(`https://www.buda.com/api/v2/markets/btc-clp/ticker?timestamp=${startTime}&timestamp=${endTime}`);
        const data = await response.json();

        if (!data.ticker) {
            throw new Error("No se recibieron datos del ticker.");
        }

        return data.ticker;
    } catch (error) {
        console.error('Error al obtener datos del ticker:', error);
        throw error;
    }
}

const inicioTiempo = 1735560000000; // Timestamp de inicio del rango de tiempo
const finTiempo = 1735563600000; // Timestamp de fin del rango de tiempo

obtenerDatosTicker(inicioTiempo, finTiempo)
    .then(datosTicker => {
        console.log("Datos del ticker:", datosTicker);

        const precioPromedioBTC = parseFloat(datosTicker.last_price[0]);
        const volumenTotalBTC = parseFloat(datosTicker.volume[0]);
        const porcentajeComisionNormal = 0.008;
        const comisionNormal = volumenTotalBTC * porcentajeComisionNormal;
        const dineroPerdido = comisionNormal * precioPromedioBTC;

        console.log(`Cantidad de dinero perdido debido a la liberación de comisiones: ${dineroPerdido.toFixed(2)} CLP`);
    })
    .catch(error => {
        console.error("Error:", error);
    });