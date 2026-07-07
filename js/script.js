import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

emailjs.init({
    publicKey: "IyuPF1ydJ4fWlOVPL"
});

const DEFAULT_CONFIG = {
    nombre: "ToxiFezt",
    cupos: 70,
    activo: true
};

let configEvento = { ...DEFAULT_CONFIG };

const formulario = document.getElementById("registro");
const modalExito = document.getElementById("modalExito");
const cerrarModal = document.getElementById("cerrarModal");
const modalLleno = document.getElementById("modalLleno");
const cerrarLleno = document.getElementById("cerrarLleno");
const contador = document.getElementById("contador");
const restantes = document.getElementById("restantes");
const boton = document.getElementById("btnRegistro");
const nombreEventoTexto = document.getElementById("nombreEventoTexto");
const mensajeLleno = document.getElementById("mensajeLleno");
const eventoNombreModal = document.querySelector(".eventoNombreModal");

async function cargarConfig() {
    try {
        const ref = doc(db, "config", "eventoActual");
        const snap = await getDoc(ref);

        if (snap.exists()) {
            configEvento = {
                ...DEFAULT_CONFIG,
                ...snap.data(),
                cupos: Number(snap.data().cupos) || DEFAULT_CONFIG.cupos
            };
        }

        nombreEventoTexto.textContent = `Registro Oficial para ${configEvento.nombre}`;
        eventoNombreModal.textContent = configEvento.nombre;
    } catch (error) {
        console.error("Error cargando configuración:", error);
    }
}

async function obtenerTotalRegistros() {
    const consulta = await getDocs(collection(db, "registros"));
    return consulta.size;
}

async function actualizarCupos() {
    await cargarConfig();

    const total = await obtenerTotalRegistros();
    const disponibles = configEvento.cupos - total;

    contador.textContent = `${total} / ${configEvento.cupos}`;

    if (!configEvento.activo) {
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
        mensajeLleno.textContent = `Los ${configEvento.cupos} lugares ya fueron ocupados.`;
    }
}

formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    await actualizarCupos();

    if (boton.disabled) {
        modalLleno.style.display = "flex";
        return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const instagram = document.getElementById("instagram").value.replace("@", "").trim();

    if (!nombre || !apellido || !instagram) {
        alert("Completa todos los campos.");
        return;
    }

    try {
        await addDoc(collection(db, "registros"), {
            nombre,
            apellido,
            instagram,
            evento: configEvento.nombre,
            fecha: new Date()
        });

        await emailjs.send(
            "service_p0r62or",
            "template_yyxalij",
            {
                nombre,
                apellido,
                instagram,
                evento: configEvento.nombre
            }
        );

        formulario.reset();
        modalExito.style.display = "flex";
        actualizarCupos();
    } catch (error) {
        console.error(error);
        alert("❌ Ocurrió un error al registrar.");
    }
});

cerrarModal.addEventListener("click", () => {
    modalExito.style.display = "none";
});

cerrarLleno.addEventListener("click", () => {
    modalLleno.style.display = "none";
});

actualizarCupos();
