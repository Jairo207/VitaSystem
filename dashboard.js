document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Cerebro del Dashboard avanzado cargado.");

    // --- 1. SEGURIDAD Y PERSONALIZACIÓN (Lo de siempre) ---
    const nombreUsuario = localStorage.getItem('nombrePaciente');
    if (!nombreUsuario) {
        window.location.href = 'index.html';
        return; 
    }

    const textoBienvenida = document.getElementById('textoBienvenida');
    if (textoBienvenida) textoBienvenida.textContent = `¡Hola, ${nombreUsuario}! 👋`;

    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        const nombreFormateado = nombreUsuario.replace(/\s+/g, '+');
        userAvatar.src = `https://ui-avatars.com/api/?name=${nombreFormateado}&background=0056b3&color=fff`;
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (evento) => {
            evento.preventDefault();
            localStorage.removeItem('nombrePaciente');
            window.location.href = 'index.html';
        });
    }

    // --- 2. LÓGICA DE NAVEGACIÓN SIDEBAR ---
    const seccionInicio = document.getElementById('seccionInicio');
    const seccionAgendar = document.getElementById('seccionAgendar');
    
    const linkInicio = document.getElementById('linkInicio');
    const linkAgendar = document.getElementById('linkAgendar');

    // Función para cambiar de sección
    function mostrarSeccion(seccionActiva, linkActivo) {
        // Ocultar todas las secciones
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        // Quitar active de todos los links
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(l => l.classList.remove('active'));
        
        // Mostrar la activa
        seccionActiva.classList.add('active');
        linkActivo.classList.add('active');

        // Si entramos a agendar, reiniciar el wizard al paso 1
        if (seccionActiva === seccionAgendar) {
            goToStep(1);
        }
    }

    if (linkInicio) linkInicio.addEventListener('click', () => mostrarSeccion(seccionInicio, linkInicio));
    if (linkAgendar) linkAgendar.addEventListener('click', () => mostrarSeccion(seccionAgendar, linkAgendar));


    // ==========================================
    // 3. LÓGICA DEL WIZARD DE AGENDAMIENTO
    // ==========================================
    let currentStep = 1;
    let selectedSpecialty = null;
    let selectedDoctorId = null;
    let selectedDoctorName = null;
    let selectedDate = null;
    let selectedTime = null;

    const stepper = document.querySelector('.stepper');
    const stepContainers = document.querySelectorAll('.booking-step');
    const step2SpecialtyLabel = document.getElementById('step2SpecialtyLabel');
    const step3DoctorLabel = document.getElementById('step3DoctorLabel');
    const doctorCardsList = document.getElementById('doctorCardsList');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const btnConfirmarFinal = document.getElementById('btnConfirmarFinal');

    // Función principal para cambiar de paso
    function goToStep(stepNumber) {
        currentStep = stepNumber;
        
        // Actualizar Stepper Header (Capturas: 1 > 2 > 3)
        stepper.querySelectorAll('.step').forEach((s, index) => {
            if (index + 1 <= currentStep) s.classList.add('active');
            else s.classList.remove('active');
        });

        // Actualizar visibilidad de los contenedores
        stepContainers.forEach(container => container.classList.remove('active'));
        document.getElementById(`step${currentStep}Container`).classList.add('active');
    }

    // --- PASO 1: SELECCIÓN DE ESPECIALIDAD ---
    document.querySelectorAll('.specialty-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedSpecialty = card.getAttribute('data-specialty');
            step2SpecialtyLabel.textContent = selectedSpecialty; // Actualizar etiqueta en Paso 2
            console.log("Especialidad seleccionada:", selectedSpecialty);
            goToStep(2);
            cargarDoctores(); // Cargar doctores basados en la especialidad
        });
    });

// ==========================================
    // 🔌 CONEXIÓN REAL A LA BASE DE DATOS (ADIÓS DATOS FALSOS)
    // ==========================================

    async function cargarDoctores() {
        doctorCardsList.innerHTML = `<div class="card" style="text-align: center; width: 100%;">Buscando doctores reales en ${selectedSpecialty}...</div>`;
        
        try {
            // Le pedimos al servidor los doctores de tu base de datos XAMPP
            const respuesta = await fetch('http://localhost:3000/api/doctores');
            const doctoresReales = await respuesta.json();

            // Filtramos solo los que sean de la especialidad seleccionada
            const doctoresFiltrados = doctoresReales.filter(doc => doc.especialidad === selectedSpecialty);

            doctorCardsList.innerHTML = ''; // Limpiamos la cajita

            if (doctoresFiltrados.length === 0) {
                doctorCardsList.innerHTML = `<div class="card" style="text-align: center; background-color: #fee2e2; color: #991b1b; width: 100%;">⚠️ Aún no hay doctores registrados en ${selectedSpecialty}.</div>`;
            } else {
                // Dibujamos las tarjetas con los datos de verdad
                doctoresFiltrados.forEach(doc => {
                    doctorCardsList.innerHTML += `
                        <div class="booking-card doctor-card" data-doctor-id="${doc.id}" data-doctor-name="${doc.nombre}" style="flex-direction: row; gap: 20px; align-items: center; justify-content: start;">
                            <img src="https://ui-avatars.com/api/?name=${doc.nombre.replace(/\s+/g, '+')}&background=E0F2FE&color=0369a1" alt="Perfil" class="avatar" style="width: 50px; height: 50px;">
                            <div>
                                <h3 style="margin: 0;">${doc.nombre}</h3>
                                <p style="margin: 0;">Especialista en ${doc.especialidad}</p>
                            </div>
                        </div>
                    `;
                });

                // Le damos vida (clic) a los doctores nuevos
                document.querySelectorAll('.doctor-card').forEach(card => {
                    card.addEventListener('click', () => {
                        selectedDoctorId = card.getAttribute('data-doctor-id');
                        selectedDoctorName = card.getAttribute('data-doctor-name');
                        step3DoctorLabel.textContent = selectedDoctorName; 
                        console.log("Doctor en base de datos seleccionado:", selectedDoctorName);
                        goToStep(3);
                        cargarHorarios(); // Pasamos a buscar los horarios de este doctor
                    });
                });
            }
        } catch (error) {
            console.error("Error conectando con Node:", error);
            doctorCardsList.innerHTML = `<div class="card" style="text-align: center; color: red; width: 100%;">🚨 Servidor apagado. Prende Node.js.</div>`;
        }
    }

    function cargarHorarios() {
        // Al entrar al paso 3, pedimos que escoja una fecha primero
        timeSlotsGrid.innerHTML = '<p style="text-align: center; width: 100%; color: #64748b;">📅 Selecciona una fecha arriba para ver los horarios del doctor.</p>'; 
        
        const fechaInput = document.getElementById('citaFecha');
        
        // Truquito para no acumular eventos cada vez que el usuario va y vuelve
        const nuevoFechaInput = fechaInput.cloneNode(true);
        fechaInput.parentNode.replaceChild(nuevoFechaInput, fechaInput);

        // Cuando el usuario elige un día en el calendario...
        nuevoFechaInput.addEventListener('change', async (e) => {
            selectedDate = e.target.value;
            console.log("Consultando horarios reales para:", selectedDate);
            
            timeSlotsGrid.innerHTML = '<p style="text-align: center; width: 100%;">⏳ Consultando disponibilidad en la base de datos...</p>';

            try {
                // Buscamos si ese doctor ya tiene citas ese día
                const respuesta = await fetch(`http://localhost:3000/api/horarios-disponibles?doctor_id=${selectedDoctorId}&fecha=${selectedDate}`);
                const horariosReales = await respuesta.json();

                timeSlotsGrid.innerHTML = ''; // Limpiar
                
                // Dibujamos los horarios, bloqueando los que ya están en la tabla "citas"
                horariosReales.forEach(slot => {
                    const isDisabled = slot.ocupado;
                    timeSlotsGrid.innerHTML += `
                        <div class="time-slot ${isDisabled ? 'disabled' : ''}" data-time="${slot.hora}">
                            ${slot.hora} ${isDisabled ? '(Ocupado)' : ''}
                        </div>
                    `;
                });

                // Clic para seleccionar la hora
                document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
                    slot.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                        slot.classList.add('selected');
                        selectedTime = slot.getAttribute('data-time');
                        console.log("Hora libre seleccionada:", selectedTime);
                        habilitarConfirmacion();
                    });
                });
                
                // Reseteamos el botón si cambian de fecha
                selectedTime = null; 
                habilitarConfirmacion();

            } catch (error) {
                console.error("Error cargando horarios:", error);
                timeSlotsGrid.innerHTML = '<p style="color:red; text-align: center; width: 100%;">🚨 Error consultando la agenda.</p>';
            }
        });
    }

    function habilitarConfirmacion() {
        if (selectedDate && selectedTime) {
            btnConfirmarFinal.classList.remove('disabled');
            btnConfirmarFinal.disabled = false;
        } else {
            btnConfirmarFinal.classList.add('disabled');
            btnConfirmarFinal.disabled = true;
        }
    }

    // --- ENVÍO FINAL DE LA CITA (Conectado a Nodemailer de la Fase 3) ---
    // --- ENVÍO FINAL DE LA CITA (Conectado a Nodemailer de la Fase 3) ---
    const finalAgendarForm = document.getElementById('finalAgendarForm');
    if (finalAgendarForm) {
        finalAgendarForm.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            
            // Le avisamos al usuario que estamos procesando porque Nodemailer tarda un par de segundos
            alert('⏳ Procesando tu cita y contactando al servidor de correos... Por favor espera un momento.');

            // 🌟 AHORA SÍ LEEMOS EL CORREO DE LA CAJITA QUE CREASTE EN EL HTML 🌟
            const patientEmailInput = document.getElementById('citaCorreoConfirmacion');
            const patientEmail = patientEmailInput.value.trim(); // .trim() quita los espacios en blanco por si acaso

            // Verificamos que no esté vacío
            if (!patientEmail) {
                alert('⚠️ Por favor, ingresa tu correo para confirmar la cita.');
                return;
            }

            const datosCita = {
                correo: patientEmail,
                doctor_id: selectedDoctorId,
                fecha: selectedDate,
                hora: selectedTime
            };

            try {
                // Hacemos la petición al Backend (La ruta '/api/agendar' que ya tenemos)
                const respuesta = await fetch('http://localhost:3000/api/agendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosCita)
                });
                const resultado = await respuesta.json();
                
                if (respuesta.ok) {
                    alert('🎉 ' + resultado.mensaje);
                    // Limpiamos el campo del correo
                    patientEmailInput.value = '';
                    // Reiniciar el wizard al inicio
                    mostrarSeccion(seccionInicio, linkInicio);
                } else {
                    alert('❌ Error: ' + resultado.mensaje);
                }
            } catch (error) {
                console.error(error);
                alert('🚨 Error de conexión. Revisa que el servidor Node esté encendido.');
            }
        });
    }

    // --- LÓGICA DE BOTONES "VOLVER" ---
    document.querySelectorAll('.back-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            goToStep(currentStep - 1);
        });
    });

});