import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const configRef = doc(db, "config", "eventoActual");

const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const lista = document.getElementById("lista");
const total = document.getElementById("total");
const disponibles = document.getElementById("disponibles");
const cuposPanel = document.getElementById("cuposPanel");
const buscar = document.getElementById("buscar");
const barraProgreso = document.getElementById("barraProgreso");

const nombreEvento = document.getElementById("nombreEvento");
const cuposEvento = document.getElementById("cuposEvento");
const eventoActivo = document.getElementById("eventoActivo");
const guardarConfigBtn = document.getElementById("guardarConfigBtn");

const exportarBtn = document.getElementById("exportarBtn");
const borrarTodosBtn = document.getElementById("borrarTodosBtn");

const modalEliminar = document.getElementById("modalEliminar");
const textoEliminar = document.getElementById("textoEliminar");
const confirmarEliminar = document.getElementById("confirmarEliminar");
const cancelarEliminar = document.getElementById("cancelarEliminar");

const modalBorrarTodos = document.getElementById("modalBorrarTodos");
const confirmarBorrarTodos = document.getElementById("confirmarBorrarTodos");
const cancelarBorrarTodos = document.getElementById("cancelarBorrarTodos");

let registros = [];
let config = {
    nombre: "ToxiFezt",
    cupos: 70,
    registrados: 0,
    activo: true
};
let idPendienteEliminar = null;

function fechaLegible(fecha) {
    if (!fecha) return "Sin fecha";

    if (fecha.toDate) {
        return fecha.toDate().toLocaleString("es-MX");
    }

    return "Sin fecha";
}

function actualizarDashboard() {
    const registrados = registros.length;
    const cupos = Number(config.cupos || 70);
    const libres = Math.max(cupos - registrados, 0);
    const porcentaje = cupos > 0 ? Math.min((registrados / cupos) * 100, 100) : 0;

    total.textContent = registrados;
    cuposPanel.textContent = cupos;
    disponibles.textContent = libres;
    barraProgreso.style.width = `${porcentaje}%`;

    nombreEvento.value = config.nombre || "ToxiFezt";
    cuposEvento.value = cupos;
    eventoActivo.checked = config.activo === true;
}

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value.trim());
    } catch (error) {
        console.error(error);
        alert("Correo o contraseña incorrectos.");
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginBox.style.display = "none";
        adminBox.style.display = "block";
        await cargarTodo();
    } else {
        loginBox.style.display = "block";
        adminBox.style.display = "none";
    }
});

async function cargarConfig() {
    const snap = await getDoc(configRef);

    if (snap.exists()) {
        config = {
            ...config,
            ...snap.data()
        };
    } else {
        await setDoc(configRef, {
            nombre: "ToxiFezt",
            cupos: 70,
            registrados: 0,
            activo: true,
            updatedAt: serverTimestamp()
        });
    }
}

async function cargarRegistros() {
    const consulta = await getDocs(collection(db, "registros"));

    registros = [];

    consulta.forEach((documento) => {
        registros.push({
            id: documento.id,
            ...documento.data()
        });
    });

    registros.sort((a, b) => {
        const fa = a.fecha?.toMillis ? a.fecha.toMillis() : 0;
        const fb = b.fecha?.toMillis ? b.fecha.toMillis() : 0;
        return fb - fa;
    });
}

async function cargarTodo() {
    lista.innerHTML = "Cargando registros...";
    await cargarConfig();
    await cargarRegistros();
    await sincronizarContador();
    mostrarRegistros(registros);
    actualizarDashboard();
}

async function sincronizarContador() {
    if (Number(config.registrados || 0) !== registros.length) {
        await updateDoc(configRef, {
            registrados: registros.length,
            updatedAt: serverTimestamp()
        });
        config.registrados = registros.length;
    }
}

function mostrarRegistros(datos) {
    lista.innerHTML = "";

    if (datos.length === 0) {
        lista.innerHTML = `
            <div class="registro-card">
                <h3>No hay registros</h3>
                <p>No se encontró ningún invitado.</p>
            </div>
        `;
        return;
    }

    datos.forEach((registro) => {
        const instagram = String(registro.instagram || "").replace("@", "");
        const fecha = fechaLegible(registro.fecha);

        lista.innerHTML += `
            <div class="registro-card">
                <h3>👤 ${registro.nombre || ""} ${registro.apellido || ""}</h3>
                <a href="https://instagram.com/${instagram}" target="_blank">📷 Abrir @${instagram}</a>
                <p>📅 ${fecha}</p>
                <button onclick="pedirEliminar('${registro.id}', '${(registro.nombre || "").replace(/'/g, "")} ${(registro.apellido || "").replace(/'/g, "")}')">Eliminar</button>
            </div>
        `;
    });
}

buscar.addEventListener("input", () => {
    const texto = buscar.value.toLowerCase().trim();

    const filtrados = registros.filter((r) =>
        String(r.nombre || "").toLowerCase().includes(texto) ||
        String(r.apellido || "").toLowerCase().includes(texto) ||
        String(r.instagram || "").toLowerCase().includes(texto)
    );

    mostrarRegistros(filtrados);
});

guardarConfigBtn.addEventListener("click", async () => {
    const nuevoNombre = nombreEvento.value.trim() || "ToxiFezt";
    const nuevosCupos = Number(cuposEvento.value);

    if (!nuevosCupos || nuevosCupos < 1) {
        alert("Los cupos deben ser un número mayor a 0.");
        return;
    }

    try {
        await updateDoc(configRef, {
            nombre: nuevoNombre,
            cupos: nuevosCupos,
            activo: eventoActivo.checked,
            registrados: registros.length,
            updatedAt: serverTimestamp()
        });

        await cargarTodo();
        alert("Configuración guardada.");
    } catch (error) {
        console.error(error);
        alert("No se pudo guardar la configuración.");
    }
});

window.pedirEliminar = (id, nombre) => {
    idPendienteEliminar = id;
    textoEliminar.textContent = `¿Seguro que quieres eliminar a ${nombre}?`;
    modalEliminar.style.display = "flex";
};

cancelarEliminar.addEventListener("click", () => {
    modalEliminar.style.display = "none";
    idPendienteEliminar = null;
});

confirmarEliminar.addEventListener("click", async () => {
    if (!idPendienteEliminar) return;

    try {
        await deleteDoc(doc(db, "registros", idPendienteEliminar));
        modalEliminar.style.display = "none";
        idPendienteEliminar = null;
        await cargarTodo();
    } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el registro.");
    }
});

borrarTodosBtn.addEventListener("click", () => {
    modalBorrarTodos.style.display = "flex";
});

cancelarBorrarTodos.addEventListener("click", () => {
    modalBorrarTodos.style.display = "none";
});

confirmarBorrarTodos.addEventListener("click", async () => {
    try {
        const consulta = await getDocs(collection(db, "registros"));
        const batch = writeBatch(db);

        consulta.forEach((documento) => {
            batch.delete(doc(db, "registros", documento.id));
        });

        batch.update(configRef, {
            registrados: 0,
            updatedAt: serverTimestamp()
        });

        await batch.commit();

        modalBorrarTodos.style.display = "none";
        await cargarTodo();
        alert("Todos los registros fueron eliminados.");
    } catch (error) {
        console.error(error);
        alert("No se pudieron borrar los registros.");
    }
});

exportarBtn.addEventListener("click", () => {
    const datos = registros.map((r) => ({
        Nombre: r.nombre || "",
        Apellido: r.apellido || "",
        Instagram: r.instagram ? `https://instagram.com/${String(r.instagram).replace("@", "")}` : "",
        Fecha: fechaLegible(r.fecha)
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Registros");
    XLSX.writeFile(libro, `${config.nombre || "ToxiFezt"}-Registros.xlsx`);
});
