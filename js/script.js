import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

emailjs.init({
    publicKey: "IyuPF1ydJ4fWlOVPL"
});

const configRef = doc(db, "config", "eventoActual");

const formulario = document.getElementById("registro");
const boton = document.getElementById("btnRegistro");
const contador = document.getElementById("contador");
const restantes = document.getElementById("restantes");
const nombreEventoTexto = document.getElementById("nombreEventoTexto");
const modalEventoNombre = document.getElementById("modalEventoNombre");
const mensajeLleno = document.getElementById("mensajeLleno");

const modalExito = document.getElementById("modalExito");
const cerrarModal = document.getElementById("cerrarModal");
const modalLleno = document.getElementById("modalLleno");
const cerrarLleno = document.getElementById("cerrarLleno");

let config = {
    nombre: "ToxiFezt",
    cupos: 70,
    registrados: 0,
    activo: true
};

function limpiarInstagram(valor) {
    return valor.replace("@", "").trim().replace(/\s/g, "");
}

function pintarConfig() {
    const registrados = Number(config.registrados || 0);
    const cupos = Number(config.cupos || 70);
    const disponibles = Math.max(cupos - registrados, 0);

    nombreEventoTexto.textContent = config.nombre || "ToxiFezt";
    modalEventoNombre.textContent = config.nombre || "ToxiFezt";
    contador.textContent = `${registrados} / ${cupos}`;

    if (!config.activo) {
        restantes.textContent = "🚫 Registro desactivado";
        boton.disabled = true;
        boton.textContent = "Registro cerrado";
        mensajeLleno.textContent = "El registro está desactivado por el administrador.";
        return;
    }

    if (disponibles > 0) {
        restantes.textContent = `Quedan ${disponibles} lugares`;
        boton.disabled = false;
        boton.textContent = "Registrarme";
    } else {
        restantes.textContent = "🚫 Registro cerrado";
        boton.disabled = true;
        boton.textContent = "Registro cerrado";
        mensajeLleno.textContent = `Los ${cupos} lugares ya fueron ocupados.`;
    }
}

async function cargarConfig() {
    try {
        const snap = await getDoc(configRef);

        if (snap.exists()) {
            config = {
                ...config,
                ...snap.data()
            };
        } else {
            restantes.textContent = "Falta configurar el evento.";
            boton.disabled = true;
            boton.textContent = "No disponible";
            return;
        }

        pintarConfig();
    } catch (error) {
        console.error("Error al cargar configuración:", error);
        restantes.textContent = "Error al cargar lugares";
        boton.disabled = true;
    }
}

formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    await cargarConfig();

    if (boton.disabled) {
        modalLleno.style.display = "flex";
        return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const instagram = limpiarInstagram(document.getElementById("instagram").value);

    if (!nombre || !apellido || !instagram) {
        alert("Completa todos los campos.");
        return;
    }

    boton.disabled = true;
    boton.textContent = "Registrando...";

    try {
        await runTransaction(db, async (transaction) => {
            const configSnap = await transaction.get(configRef);

            if (!configSnap.exists()) {
                throw new Error("No existe la configuración del evento.");
            }

            const datos = configSnap.data();
            const registrados = Number(datos.registrados || 0);
            const cupos = Number(datos.cupos || 70);
            const activo = datos.activo === true;

            if (!activo) {
                throw new Error("REGISTRO_DESACTIVADO");
            }

            if (registrados >= cupos) {
                throw new Error("EVENTO_LLENO");
            }

            const nuevoRegistroRef = doc(collection(db, "registros"));

            transaction.set(nuevoRegistroRef, {
                nombre,
                apellido,
                instagram,
                evento: datos.nombre || "ToxiFezt",
                fecha: serverTimestamp()
            });

            transaction.update(configRef, {
                registrados: registrados + 1,
                updatedAt: serverTimestamp()
            });
        });

        await emailjs.send(
            "service_p0r62or",
            "template_yyxalij",
            {
                nombre,
                apellido,
                instagram
            }
        );

        formulario.reset();
        modalExito.style.display = "flex";
        await cargarConfig();

    } catch (error) {
        console.error("Error al registrar:", error);

        if (error.message === "EVENTO_LLENO" || error.message === "REGISTRO_DESACTIVADO") {
            modalLleno.style.display = "flex";
        } else {
            alert("❌ Ocurrió un error al registrar. Revisa la consola.");
        }

        await cargarConfig();
    }
});

cerrarModal.addEventListener("click", () => {
    modalExito.style.display = "none";
});

cerrarLleno.addEventListener("click", () => {
    modalLleno.style.display = "none";
});

cargarConfig();
