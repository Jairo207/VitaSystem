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
            // Borramos el nombre y el correo del paciente
            localStorage.removeItem('nombrePaciente'); 
            localStorage.removeItem('correoPaciente'); 
            window.location.href = 'index.html';
        });
    }

    // --- 2. LÓGICA DE NAVEGACIÓN SIDEBAR ---
    const seccionInicio = document.getElementById('seccionInicio');
    const seccionAgendar = document.getElementById('seccionAgendar');
    
    const linkInicio = document.getElementById('linkInicio');
    const linkAgendar = document.getElementById('linkAgendar');

    function mostrarSeccion(seccionActiva, linkActivo) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(l => l.classList.remove('active'));
        
        seccionActiva.classList.add('active');
        linkActivo.classList.add('active');

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

    function goToStep(stepNumber) {
        currentStep = stepNumber;
        stepper.querySelectorAll('.step').forEach((s, index) => {
            if (index + 1 <= currentStep) s.classList.add('active');
            else s.classList.remove('active');
        });

        stepContainers.forEach(container => container.classList.remove('active'));
        document.getElementById(`step${currentStep}Container`).classList.add('active');
    }

    // --- PASO 1: SELECCIÓN DE ESPECIALIDAD ---
    document.querySelectorAll('.specialty-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedSpecialty = card.getAttribute('data-specialty');
            step2SpecialtyLabel.textContent = selectedSpecialty; 
            console.log("Especialidad seleccionada:", selectedSpecialty);
            goToStep(2);
            cargarDoctores(); 
        });
    });

    async function cargarDoctores() {
        doctorCardsList.innerHTML = `<div class="card" style="text-align: center; width: 100%;">Buscando doctores reales en ${selectedSpecialty}...</div>`;
        
        try {
            const respuesta = await fetch('http://localhost:3000/api/doctores');
            const doctoresReales = await respuesta.json();

            const doctoresFiltrados = doctoresReales.filter(doc => doc.especialidad === selectedSpecialty);

            doctorCardsList.innerHTML = ''; 

            if (doctoresFiltrados.length === 0) {
                doctorCardsList.innerHTML = `<div class="card" style="text-align: center; background-color: #fee2e2; color: #991b1b; width: 100%;">⚠️ Aún no hay doctores registrados en ${selectedSpecialty}.</div>`;
            } else {
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

                document.querySelectorAll('.doctor-card').forEach(card => {
                    card.addEventListener('click', () => {
                        selectedDoctorId = card.getAttribute('data-doctor-id');
                        selectedDoctorName = card.getAttribute('data-doctor-name');
                        step3DoctorLabel.textContent = selectedDoctorName; 
                        console.log("Doctor seleccionado:", selectedDoctorName);
                        goToStep(3);
                        cargarHorarios(); 
                    });
                });
            }
        } catch (error) {
            console.error("Error conectando con Node:", error);
            doctorCardsList.innerHTML = `<div class="card" style="text-align: center; color: red; width: 100%;">🚨 Servidor apagado. Prende Node.js.</div>`;
        }
    }

    function cargarHorarios() {
        timeSlotsGrid.innerHTML = '<p style="text-align: center; width: 100%; color: #64748b;">📅 Selecciona una fecha arriba para ver los horarios del doctor.</p>'; 
        
        const fechaInput = document.getElementById('citaFecha');
        const nuevoFechaInput = fechaInput.cloneNode(true);
        fechaInput.parentNode.replaceChild(nuevoFechaInput, fechaInput);

        nuevoFechaInput.addEventListener('change', async (e) => {
            selectedDate = e.target.value;
            timeSlotsGrid.innerHTML = '<p style="text-align: center; width: 100%;">⏳ Consultando disponibilidad en la base de datos...</p>';

            try {
                const respuesta = await fetch(`http://localhost:3000/api/horarios-disponibles?doctor_id=${selectedDoctorId}&fecha=${selectedDate}`);
                const horariosReales = await respuesta.json();

                timeSlotsGrid.innerHTML = ''; 
                
                horariosReales.forEach(slot => {
                    const isDisabled = slot.ocupado;
                    timeSlotsGrid.innerHTML += `
                        <div class="time-slot ${isDisabled ? 'disabled' : ''}" data-time="${slot.hora}">
                            ${slot.hora} ${isDisabled ? '(Ocupado)' : ''}
                        </div>
                    `;
                });

                document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
                    slot.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                        slot.classList.add('selected');
                        selectedTime = slot.getAttribute('data-time');
                        habilitarConfirmacion();
                    });
                });
                
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

    // --- ENVÍO FINAL DE LA CITA ---
    const finalAgendarForm = document.getElementById('finalAgendarForm');
    if (finalAgendarForm) {
        finalAgendarForm.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            
            alert('⏳ Procesando tu cita y contactando al servidor de correos... Por favor espera un momento.');

            const patientEmailInput = document.getElementById('citaCorreoConfirmacion');
            const patientEmail = patientEmailInput.value.trim(); 

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
                const respuesta = await fetch('http://localhost:3000/api/agendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosCita)
                });
                const resultado = await respuesta.json();
                
                if (respuesta.ok) {
                    alert('🎉 ' + resultado.mensaje);
                    patientEmailInput.value = '';
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

    // ==========================================
    // 4. LÓGICA DE "MIS CITAS" (COMPLETAMENTE ARREGLADA)
    // ==========================================
    const seccionMisCitas = document.getElementById('seccionMisCitas');
    const linkMisCitas = document.getElementById('linkMisCitas');
    const contenedorMisCitas = document.getElementById('contenedorMisCitas');

    if (linkMisCitas) {
        linkMisCitas.addEventListener('click', () => {
            mostrarSeccion(seccionMisCitas, linkMisCitas);
            cargarMisCitas(); 
        });
    }

    async function cargarMisCitas() {
        // Sacamos el correo limpio, sin molestar al usuario
        let correo = localStorage.getItem('correoPaciente');
        
        if (!correo) {
            // Si por alguna razón el correo no está guardado, le avisamos para que vuelva a entrar
            if (contenedorMisCitas) {
                contenedorMisCitas.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444; background:#fee2e2; border-radius:8px;">⚠️ Sesión incompleta. Por favor cierra sesión y vuelve a ingresar.</div>';
            }
            return;
        }

        if (contenedorMisCitas) {
            contenedorMisCitas.innerHTML = '<div style="text-align:center; padding: 20px;">⏳ Buscando tus citas en la base de datos...</div>';
        }

        try {
            const respuesta = await fetch(`http://localhost:3000/api/mis-citas?correo=${correo}`);
            const citas = await respuesta.json();

            if (!respuesta.ok) {
                if (contenedorMisCitas) contenedorMisCitas.innerHTML = `<div style="color:red; text-align:center; padding:20px;">❌ ${citas.mensaje}</div>`;
                return;
            }

            if (citas.length === 0) {
                if (contenedorMisCitas) contenedorMisCitas.innerHTML = '<div style="text-align:center; padding: 20px; background:#f1f5f9; border-radius:10px;">No tienes citas programadas aún. Anímate a agendar una. 🏥</div>';
                return;
            }

            // Pintar las tarjetas de las citas
            let htmlCitas = '<div style="display: flex; flex-direction: column; gap: 15px;">';
            citas.forEach(cita => {
                const fechaLimpia = cita.fecha.substring(0, 10);
                
                htmlCitas += `
                    <div class="card" style="border-left: 5px solid #0ea5e9; padding: 15px; display: flex; justify-content: space-between; align-items: center; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius: 8px;">
                        <div>
                            <h3 style="margin: 0; color: #0f172a; font-size: 1.1rem;">Cita de ${cita.especialidad}</h3>
                            <p style="margin: 5px 0 0 0; color: #475569;">👨‍⚕️ Dr. ${cita.doctor}</p>
                        </div>
                        <div style="text-align: right; background: #f0f9ff; padding: 10px; border-radius: 8px;">
                            <span style="display: block; font-weight: bold; color: #0284c7; margin-bottom: 5px;">📅 ${fechaLimpia}</span>
                            <span style="display: block; font-weight: bold; color: #ea580c;">⏰ ${cita.hora}</span>
                        </div>
                    </div>
                `;
            });
            htmlCitas += '</div>';

            if (contenedorMisCitas) contenedorMisCitas.innerHTML = htmlCitas;

        } catch (error) {
            console.error("Error cargando mis citas:", error);
            if (contenedorMisCitas) contenedorMisCitas.innerHTML = '<div style="color:red; text-align:center; padding:20px;">🚨 Error conectando con el servidor de Node.js.</div>';
        }
    }
});