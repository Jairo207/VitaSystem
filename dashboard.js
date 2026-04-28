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
    const contenedorProximasCitas = document.getElementById('contenedorProximasCitas');
    const contenedorCalendario = document.getElementById('contenedorCalendario');

    // --- ESTADO GLOBAL DEL CALENDARIO (Faltaba declarar esto) ---
    let mesVista = new Date().getMonth();
    let anioVista = new Date().getFullYear();
    let todasLasCitas = [];

    function mostrarSeccion(seccionActiva, linkActivo) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(l => l.classList.remove('active'));
        
        seccionActiva.classList.add('active');
        linkActivo.classList.add('active');

        if (seccionActiva === seccionAgendar) {
            goToStep(1);
        }
        if (seccionActiva === seccionInicio) {
            cargarProximasCitas();
        }
    }

    if (linkInicio) linkInicio.addEventListener('click', () => mostrarSeccion(seccionInicio, linkInicio));
    if (linkAgendar) linkAgendar.addEventListener('click', () => mostrarSeccion(seccionAgendar, linkAgendar));

    async function cargarProximasCitas() {
        let correo = localStorage.getItem('correoPaciente');
        if (!correo || !contenedorProximasCitas) return;

        contenedorProximasCitas.innerHTML = '<div style="text-align:center; padding: 20px;">⏳ Consultando tus próximas citas...</div>';

        try {
            const respuesta = await fetch(`http://127.0.0.1:3000/api/mis-citas?correo=${correo}`);
            const citas = await respuesta.json();

            if (!respuesta.ok) {
                contenedorProximasCitas.innerHTML = `<div style="color:red; text-align:center; padding:20px;">❌ Error al cargar datos.</div>`;
                return;
            }

            todasLasCitas = citas; // Guardamos las citas para la navegación del calendario
            // Renderizar el calendario con todas las citas obtenidas
            renderizarCalendario(todasLasCitas, mesVista, anioVista);

            // Obtener fecha de hoy en formato local YYYY-MM-DD
            const hoy = new Date().toLocaleDateString('en-CA'); 

            // 1. Filtrar solo citas de hoy o futuras
            const proximas = citas.filter(c => c.fecha.substring(0, 10) >= hoy);

            if (proximas.length === 0) {
                contenedorProximasCitas.innerHTML = `
                    <div class="card" style="text-align: center; padding: 30px; margin-top:20px;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
                        <h3>No tienes citas próximas</h3>
                        <p>Mantente al día con tu salud agendando una nueva consulta.</p>
                        <button class="btn-primary" style="margin-top: 15px;" id="btnAgendarDesdeInicio">Agendar Ahora</button>
                    </div>`;
                
                document.getElementById('btnAgendarDesdeInicio')?.addEventListener('click', () => linkAgendar.click());
                return;
            }

            // 2. Tomar la fecha de la primera cita disponible (la más cercana)
            const fechaCercana = proximas[0].fecha.substring(0, 10);
            
            // 3. Filtrar todas las citas que coincidan con esa fecha específica
            const citasDelDia = proximas.filter(c => c.fecha.substring(0, 10) === fechaCercana);

            let html = `<h3>📅 Próximas citas: ${fechaCercana === hoy ? 'Hoy' : fechaCercana}</h3><div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">`;
            
            citasDelDia.forEach((cita, index) => {
                html += `
                    <div class="card" style="border-left: 5px solid #ea580c; padding: 20px; display: flex; justify-content: space-between; align-items: center; background: white; text-align: left; animation-delay: ${index * 0.1}s;">
                        <div>
                            <span style="background: #ffedd5; color: #9a3412; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">${cita.especialidad}</span>
                            <h3 style="margin: 10px 0 5px 0;">Dr. ${cita.doctor}</h3>
                            <p style="color: #64748b; margin: 0;">Centro Médico VitaSystem</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 1.5rem; font-weight: 800; color: #1e293b;">${cita.hora.substring(0, 5)}</span>
                            <button class="btn-cancelar-cita" onclick="cancelarCita(${cita.id})" style="margin-top: 8px;">Cancelar</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            contenedorProximasCitas.innerHTML = html;

        } catch (error) {
            contenedorProximasCitas.innerHTML = '<div style="color:red; text-align:center; padding:20px;">🚨 Error de conexión.</div>';
        }
    }

    function renderizarCalendario(citas, mes, anio) {
        if (!contenedorCalendario) return;

        const ahora = new Date();
        const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        // Primer día del mes y cantidad de días
        const primerDiaSemana = new Date(anio, mes, 1).getDay();
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();

        // Ajuste para que lunes sea el primer día (0=Dom en JS, queremos 0=Lun)
        const offset = (primerDiaSemana === 0 ? 6 : primerDiaSemana - 1);

        // Mapear fechas de citas para búsqueda rápida (YYYY-MM-DD)
        const fechasConCita = citas.map(c => (typeof c.fecha === 'string' ? c.fecha.substring(0, 10) : ''));

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="btn-cal" id="prevMonth">‹</button>
                    <h3>${nombresMeses[mes]} ${anio}</h3>
                    <button class="btn-cal" id="nextMonth">›</button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-day-head">Lun</div>
                    <div class="calendar-day-head">Mar</div>
                    <div class="calendar-day-head">Mié</div>
                    <div class="calendar-day-head">Jue</div>
                    <div class="calendar-day-head">Vie</div>
                    <div class="calendar-day-head">Sáb</div>
                    <div class="calendar-day-head">Dom</div>
        `;

        // Espacios vacíos para el inicio del mes
        for (let i = 0; i < offset; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Generar días del mes
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaIterada = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const tieneCita = fechasConCita.includes(fechaIterada);
            const esHoy = dia === ahora.getDate() && mes === ahora.getMonth() && anio === ahora.getFullYear();

            html += `
                <div class="calendar-day ${tieneCita ? 'has-appointment' : ''} ${esHoy ? 'today' : ''}" title="${tieneCita ? 'Tienes una cita' : ''}">
                    ${dia}
                    ${tieneCita ? '<div class="appointment-dot"></div>' : ''}
                </div>
            `;
        }

        html += `
                </div>
            </div>`;
        contenedorCalendario.innerHTML = html;

        // Eventos de los botones de cambio de mes
        document.getElementById('prevMonth').addEventListener('click', () => {
            mesVista--;
            if (mesVista < 0) {
                mesVista = 11;
                anioVista--;
            }
            renderizarCalendario(todasLasCitas, mesVista, anioVista);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            mesVista++;
            if (mesVista > 11) {
                mesVista = 0;
                anioVista++;
            }
            renderizarCalendario(todasLasCitas, mesVista, anioVista);
        });
    }

    // Cargar inicialmente al entrar
    cargarProximasCitas();

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
            const respuesta = await fetch('http://127.0.0.1:3000/api/doctores');
            const doctoresReales = await respuesta.json();

            const doctoresFiltrados = doctoresReales.filter(doc => doc.especialidad === selectedSpecialty);

            doctorCardsList.innerHTML = ''; 

            if (doctoresFiltrados.length === 0) {
                doctorCardsList.innerHTML = `<div class="card" style="text-align: center; background-color: #fee2e2; color: #991b1b; width: 100%;">⚠️ Aún no hay doctores registrados en ${selectedSpecialty}.</div>`;
            } else {
                doctoresFiltrados.forEach(doc => {
                    doctorCardsList.innerHTML += `
                        <div class="booking-card doctor-card" data-doctor-id="${doc.id}" data-doctor-name="${doc.nombre}">
                            <img src="https://ui-avatars.com/api/?name=${doc.nombre.replace(/\s+/g, '+')}&background=E0F2FE&color=0369a1" alt="Perfil" class="avatar" style="width: 60px; height: 60px; margin-bottom: 12px;">
                            <div>
                                <h3 style="margin: 0; font-size: 1rem;">${doc.nombre}</h3>
                                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Especialista</p>
                                <span class="available-tag">Disponible hoy</span>
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
                const respuesta = await fetch(`http://127.0.0.1:3000/api/horarios-disponibles?doctor_id=${selectedDoctorId}&fecha=${selectedDate}`);
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
                const respuesta = await fetch('http://127.0.0.1:3000/api/agendar', {
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

    // --- FUNCIÓN GLOBAL DE CANCELACIÓN ---
    window.cancelarCita = async (citaId) => {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita? Recuerda que cancelaciones con menos de 24 horas de antelación conllevan una penalización.')) {
            return;
        }

        try {
            const respuesta = await fetch('http://127.0.0.1:3000/api/cancelar-cita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cita_id: citaId })
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                alert(resultado.mensaje);
                // Recargar los datos actuales
                cargarProximasCitas();
                if (seccionMisCitas.classList.contains('active')) {
                    cargarMisCitas();
                }
            } else if (respuesta.status === 404) {
                alert('❌ Error 404: La ruta de cancelación no se encontró. ¿Reiniciaste el servidor Node.js?');
            } else {
                const resultado = await respuesta.json();
                alert('❌ ' + resultado.mensaje);
            }
        } catch (error) {
            console.error("Error al cancelar:", error);
            alert('🚨 Error de conexión al intentar cancelar.');
        }
    };

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
            const respuesta = await fetch(`http://127.0.0.1:3000/api/mis-citas?correo=${correo}`);
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
                            <button class="btn-cancelar-cita" onclick="cancelarCita(${cita.id})" style="margin-top: 10px; width: 100%;">Cancelar</button>
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