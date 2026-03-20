document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 JavaScript cargado. Listo para funcionar.");

    // --- 1. CAPTURAR ELEMENTOS ---
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const btnAcceder = document.getElementById('btnAcceder'); // Botón naranja
    
    const closeLogin = document.getElementById('closeModal');
    const closeRegister = document.getElementById('closeRegisterModal');

    // --- 2. ABRIR Y CERRAR VENTANITAS (MODALES) ---
    if (btnLogin) btnLogin.addEventListener('click', () => loginModal.style.display = 'flex');
    if (btnAcceder) btnAcceder.addEventListener('click', () => loginModal.style.display = 'flex');
    if (btnRegister) btnRegister.addEventListener('click', () => registerModal.style.display = 'flex');

    if (closeLogin) closeLogin.addEventListener('click', () => loginModal.style.display = 'none');
    if (closeRegister) closeRegister.addEventListener('click', () => registerModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });

    // --- 3. LÓGICA DE INICIAR SESIÓN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(evento) {
            evento.preventDefault(); 
            
            const datosLogin = {
                correo: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosLogin)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('✅ ' + resultado.mensaje);
                    localStorage.setItem('nombrePaciente', resultado.nombreUsuario);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('❌ ' + resultado.mensaje); // Clave incorrecta
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert('🚨 Servidor apagado. Recuerda prender Node.js');
            }
        });
    }

    // --- 4. LÓGICA DE CREAR CUENTA (REGISTRO) ---
    // --- 4. LÓGICA DE CREAR CUENTA (REGISTRO) ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(evento) {
            evento.preventDefault(); 
            
            // 🚨 ALERTA DE PRUEBA: Si sale esto, el botón SÍ funciona
            alert('🛠️ ¡El botón funciona! Capturando datos...');
            
            // Empaquetamos lo que el usuario escribió
            const datosPaciente = {
                nombre: document.getElementById('regNombre').value,
                cedula: document.getElementById('regCedula').value,
                // AQUÍ CORREGIMOS EL ID: ahora busca 'regCorreo'
                correo: document.getElementById('regCorreo').value, 
                telefono: document.getElementById('regTelefono').value,
                password: document.getElementById('regPassword').value
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosPaciente)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('🎉 ' + resultado.mensaje);
                    localStorage.setItem('nombrePaciente', resultado.nombreUsuario);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('❌ ' + resultado.mensaje); 
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert('🚨 Servidor apagado. Recuerda prender Node.js');
            }
        });
    } else {
        console.log("⚠️ OJO: No se encontró el formulario 'registerForm' en el HTML.");
    }
});