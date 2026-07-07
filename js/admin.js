import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const DEFAULT_CONFIG = {
    nombre: "ToxiFezt",
    cupos: 70,
    activo: true
};

let configEvento = { ...DEFAULT_CONFIG };
let registros = [];
let idParaEliminar = null;

const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const lista = document.getElementById("lista");
const total = document.getElementById("total");
const cuposDash = document.getElementById("cuposDash");
const disponibles = document.getElementById("disponibles");
const buscar = document.getElementById("buscar");
const porcentaje = document.getElementById("porcentaje");
const barraProgreso = document.getElementById("barraProgreso");

const configNombre = document.getElementById("configNombre");
const configCupos = document.getElementById("configCupos");
const configActivo = document.getElementById("configActivo");
const guardarConfigBtn = document.getElementById("guardarConfigBtn");
const exportarBtn = document.getElementById("exportarBtn");
const borrarTodoBtn = document.getElementById("borrarTodoBtn");

const modalEliminar = document.getElementById("modalEliminar");
const textoEliminar = document.getElementById("textoEliminar");
const cancelarEliminar = document.getElementById("cancelarEliminar");
const confirmarEliminar = document.getElementById("confirmarEliminar");

const modalBorrarTodo = document.getElementById("modalBorrarTodo");
const cancelarBorrarTodo = document.getElementById("cancelarBorrarTodo");
const confirmarBorrarTodo = document.getElementById("confirmarBorrarTodo");

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value.trim());
    } catch (error) {
        alert("Correo o contraseña incorrectos.");
        console.log(error);
    }
});

password.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginBox.style.display = "none";
        adminBox.style.display = "block";

        try {
            await cargarConfig();
            await cargarRegistros();
        } catch (error) {
            console.error("Error cargando el panel:", error);
            alert("No se pudo cargar el panel. Revisa las reglas de Firestore y que permitan leer/escribir config y registros con sesión iniciada.");
        }
    } else {
        loginBox.style.display = "block";
        adminBox.style.display = "none";
    }
});

async function cargarConfig() {
    const ref = doc(db, "config", "eventoActual");
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const data = snap.data();
        configEvento = {
            ...DEFAULT_CONFIG,
            ...data,
            cupos: Number(data.cupos) || DEFAULT_CONFIG.cupos
        };
    } else {
        await setDoc(ref, DEFAULT_CONFIG);
        configEvento = { ...DEFAULT_CONFIG };
    }

    configNombre.value = configEvento.nombre;
    configCupos.value = configEvento.cupos;
    configActivo.checked = Boolean(configEvento.activo);
}

async function guardarConfig() {
    const nuevoNombre = configNombre.value.trim() || "ToxiFezt";
    const nuevosCupos = Number(configCupos.value);

    if (!nuevosCupos || nuevosCupos < 1) {
        alert("Escribe una cantidad válida de cupos.");
        return;
    }

    configEvento = {
        nombre: nuevoNombre,
        cupos: nuevosCupos,
        activo: configActivo.checked
    };

    await setDoc(doc(db, "config", "eventoActual"), configEvento);
    await cargarRegistros();
    alert("✅ Configuración guardada.");
}

async function cargarRegistros() {
    lista.innerHTML = "";
    const consulta = await getDocs(collection(db, "registros"));
    registros = [];

    consulta.forEach((documento) => {
        registros.push({
            id: documento.id,
            ...documento.data()
        });
    });

    registros.sort((a, b) => obtenerFechaMs(b.fecha) - obtenerFechaMs(a.fecha));
    mostrarRegistros(registros);
}

function mostrarDashboard() {
    const totalRegistros = registros.length;
    const cupos = configEvento.cupos;
    const libres = Math.max(cupos - totalRegistros, 0);
    const pct = cupos > 0 ? Math.min(Math.round((totalRegistros / cupos) * 100), 100) : 0;

    total.textContent = totalRegistros;
    cuposDash.textContent = cupos;
    disponibles.textContent = libres;
    porcentaje.textContent = `${pct}%`;
    barraProgreso.style.width = `${pct}%`;
}

function mostrarRegistros(datos) {
    lista.innerHTML = "";
    mostrarDashboard();

    if (datos.length === 0) {
        lista.innerHTML = `
            <div class="registro-card">
                <h3>No hay resultados</h3>
                <p>No se encontró ningún registro.</p>
            </div>
        `;
        return;
    }

    datos.forEach((registro) => {
        const instagram = String(registro.instagram || "").replace("@", "");
        const fechaTexto = formatearFecha(registro.fecha);
        const nombreCompleto = `${registro.nombre || ""} ${registro.apellido || ""}`.trim();

        lista.innerHTML += `
            <div class="registro-card">
                <h3>👤 ${escapeHtml(nombreCompleto)}</h3>
                <p>📅 ${fechaTexto}</p>
                <a href="https://instagram.com/${encodeURIComponent(instagram)}" target="_blank">
                    📷 Abrir @${escapeHtml(instagram)}
                </a>
                <button onclick="pedirEliminarRegistro('${registro.id}')">
                    Eliminar
                </button>
            </div>
        `;
    });
}

buscar.addEventListener("input", () => {
    const texto = buscar.value.toLowerCase().trim();

    const filtrados = registros.filter((r) => {
        const nombre = String(r.nombre || "").toLowerCase();
        const apellido = String(r.apellido || "").toLowerCase();
        const instagram = String(r.instagram || "").toLowerCase();
        return nombre.includes(texto) || apellido.includes(texto) || instagram.includes(texto);
    });

    mostrarRegistros(filtrados);
});

window.pedirEliminarRegistro = (id) => {
    const registro = registros.find((r) => r.id === id);
    idParaEliminar = id;

    textoEliminar.textContent = registro
        ? `¿Seguro que quieres eliminar a ${registro.nombre} ${registro.apellido}?`
        : "¿Seguro que quieres eliminar este registro?";

    modalEliminar.style.display = "flex";
};

cancelarEliminar.addEventListener("click", () => {
    idParaEliminar = null;
    modalEliminar.style.display = "none";
});

confirmarEliminar.addEventListener("click", async () => {
    if (!idParaEliminar) return;
    await deleteDoc(doc(db, "registros", idParaEliminar));
    idParaEliminar = null;
    modalEliminar.style.display = "none";
    await cargarRegistros();
});

borrarTodoBtn.addEventListener("click", () => {
    modalBorrarTodo.style.display = "flex";
});

cancelarBorrarTodo.addEventListener("click", () => {
    modalBorrarTodo.style.display = "none";
});

confirmarBorrarTodo.addEventListener("click", async () => {
    const consulta = await getDocs(collection(db, "registros"));
    const eliminaciones = [];

    consulta.forEach((documento) => {
        eliminaciones.push(deleteDoc(doc(db, "registros", documento.id)));
    });

    await Promise.all(eliminaciones);
    modalBorrarTodo.style.display = "none";
    await cargarRegistros();
    alert("✅ Todos los registros fueron eliminados.");
});

guardarConfigBtn.addEventListener("click", async () => {
    try {
        await guardarConfig();
    } catch (error) {
        console.error("Error guardando configuración:", error);
        alert("No se pudo guardar. Revisa que las reglas de Firestore permitan escribir en config con admin autenticado.");
    }
});

exportarBtn.addEventListener("click", () => {
    if (registros.length === 0) {
        alert("No hay registros para exportar.");
        return;
    }

    const datos = registros.map((r, index) => ({
        "#": index + 1,
        "Nombre": r.nombre || "",
        "Apellido": r.apellido || "",
        "Instagram": `https://instagram.com/${String(r.instagram || "").replace("@", "")}`,
        "Evento": r.evento || configEvento.nombre,
        "Fecha": formatearFecha(r.fecha)
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Registros");
    XLSX.writeFile(libro, `${configEvento.nombre}-Registros.xlsx`);
});

function obtenerFechaMs(fecha) {
    if (!fecha) return 0;
    if (typeof fecha.toMillis === "function") return fecha.toMillis();
    if (fecha.seconds) return fecha.seconds * 1000;
    return new Date(fecha).getTime() || 0;
}

function formatearFecha(fecha) {
    const ms = obtenerFechaMs(fecha);
    if (!ms) return "Sin fecha";
    return new Date(ms).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function escapeHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
