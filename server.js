const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer'); // <--- AGREGA ESTO

const app = express();

app.use(cors());
app.use(express.json()); 

// Conexión a XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vitasystem'
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Conectado a la base de datos MySQL de XAMPP');
});

// ==========================================
// RUTA 1: REGISTRAR PACIENTE (Crear Cuenta)
// ==========================================
app.post('/api/registro', (req, res) => {
    const { nombre, cedula, correo, telefono, password } = req.body;
    const query = 'INSERT INTO pacientes (nombre, cedula, correo, telefono, password) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [nombre, cedula, correo, telefono, password], (error, resultados) => {
        if (error) {
            console.error("Error al registrar:", error);
            return res.status(500).json({ mensaje: 'Error: Tal vez el correo o cédula ya existen.' });
        }
        res.status(200).json({ mensaje: 'Paciente registrado con éxito', nombreUsuario: nombre });
    });
});

// ==========================================
// RUTA 2: INICIAR SESIÓN (Login)
// ==========================================
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const query = 'SELECT * FROM pacientes WHERE correo = ? AND password = ?';

    db.query(query, [correo, password], (error, resultados) => {
        if (error) {
            console.error("Error en login:", error);
            return res.status(500).json({ mensaje: 'Error en la base de datos.' });
        }

        if (resultados.length > 0) {
            res.status(200).json({ mensaje: '¡Bienvenido de nuevo!', nombreUsuario: resultados[0].nombre });
        } else {
            res.status(401).json({ mensaje: 'Correo o contraseña incorrectos. Intenta de nuevo.' });
        }
    });
});
// ==========================================
// CONFIGURACIÓN DE NODEMAILER (CORREOS)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jairo.cardonag@cun.edu.co', // ⚠️ PON TU CORREO AQUÍ
        pass: 'csvhduvocjdwxeft'    // ⚠️ PON TU CLAVE DE APLICACIÓN AQUÍ (Te explico abajo qué es esto)
    }
});

// ==========================================
// RUTA 3: OBTENER DOCTORES DISPONIBLES
// ==========================================
app.get('/api/doctores', (req, res) => {
    db.query('SELECT * FROM doctores', (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener doctores' });
        res.json(resultados); // Enviamos la lista de doctores al Frontend
    });
});

// ==========================================
// RUTA 4: AGENDAR CITA Y ENVIAR CORREO
// ==========================================
app.post('/api/agendar', (req, res) => {
    const { correo, doctor_id, fecha, hora } = req.body;

    // 1. Buscamos el ID del paciente usando el correo que ingresó
    db.query('SELECT id, nombre FROM pacientes WHERE correo = ?', [correo], (errPac, resPac) => {
        if (errPac || resPac.length === 0) {
            return res.status(404).json({ mensaje: 'No encontramos un paciente con ese correo. Verifica e intenta de nuevo.' });
        }

        const paciente = resPac[0];

        // 2. Guardamos la cita en la tabla 'citas'
        const queryCita = 'INSERT INTO citas (paciente_id, doctor_id, fecha, hora) VALUES (?, ?, ?, ?)';
        db.query(queryCita, [paciente.id, doctor_id, fecha, hora], (errCita) => {
            if (errCita) return res.status(500).json({ mensaje: 'Error al guardar la cita en la base de datos.' });

            // 3. Buscamos el nombre del doctor para armar un correo bien presentado
            db.query('SELECT nombre FROM doctores WHERE id = ?', [doctor_id], (errDoc, resDoc) => {
                const nombreDoctor = resDoc[0].nombre;

                // 4. ¡DISPARAMOS EL CORREO!
                const mailOptions = {
                    from: 'jairo.cardonag@cun.edu.co', // ⚠️ PON TU CORREO AQUÍ TAMBIÉN
                    to: correo,
                    subject: '🏥 Confirmación de Cita Médica - VitaSystem',
                    text: `¡Hola ${paciente.nombre}!\n\nTu cita ha sido agendada con éxito en VitaSystem.\n\n👨‍⚕️ Doctor: ${nombreDoctor}\n📅 Fecha: ${fecha}\n⏰ Hora: ${hora}\n\nPor favor llega 15 minutos antes.\n\nAtentamente,\nEl equipo de VitaSystem`
                };

                transporter.sendMail(mailOptions, (errorInfo) => {
                    if (errorInfo) {
                        console.error('Error Nodemailer:', errorInfo);
                        return res.status(200).json({ mensaje: 'Cita guardada, pero hubo un error enviando el correo. (Revisa tu contraseña de Gmail)' });
                    }
                    res.status(200).json({ mensaje: '¡Cita agendada y correo enviado con éxito!' });
                });
            });
        });
    });
});
// ==========================================
// RUTA 5: CONSULTAR HORARIOS DISPONIBLES REALES
// ==========================================
app.get('/api/horarios-disponibles', (req, res) => {
    const { doctor_id, fecha } = req.query;
    
    const horariosBase = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    db.query('SELECT hora FROM citas WHERE doctor_id = ? AND fecha = ?', [doctor_id, fecha], (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al consultar horarios' });

        const horasOcupadas = resultados.map(cita => cita.hora.substring(0, 5));

        const disponibilidad = horariosBase.map(hora => ({
            hora: hora,
            ocupado: horasOcupadas.includes(hora) 
        }));

        res.json(disponibilidad);
    });
});

// ==========================================
// RUTA 6: CONSULTAR MIS CITAS POR CORREO
// ==========================================
app.get('/api/mis-citas', (req, res) => {
    const correoPaciente = req.query.correo;

    if (!correoPaciente) {
        return res.status(400).json({ mensaje: 'El correo es obligatorio.' });
    }

    // 1. Primero buscamos el ID del paciente usando su correo
    db.query('SELECT id FROM pacientes WHERE correo = ?', [correoPaciente], (errPac, resPac) => {
        if (errPac || resPac.length === 0) {
            return res.status(404).json({ mensaje: 'No encontramos un paciente con ese correo.' });
        }

        const pacienteId = resPac[0].id;

        // 2. Ahora sí buscamos las citas usando el ID del paciente y traemos los datos del doctor
        const consultaSQL = `
            SELECT citas.id, citas.fecha, citas.hora, doctores.nombre AS doctor, doctores.especialidad 
            FROM citas 
            JOIN doctores ON citas.doctor_id = doctores.id 
            WHERE citas.paciente_id = ? AND citas.estado = 'Pendiente'
            ORDER BY citas.fecha ASC, citas.hora ASC
        `;

        db.query(consultaSQL, [pacienteId], (error, resultados) => {
            if (error) {
                console.error('Error buscando citas:', error);
                return res.status(500).json({ mensaje: 'Error al buscar tus citas.' });
            }
            
            res.json(resultados);
        });
    });
});

// ==========================================
// RUTA 7: CANCELAR CITA CON PENALIZACIÓN
// ==========================================
app.post('/api/cancelar-cita', (req, res) => {
    const { cita_id } = req.body;

    // 1. Obtener la fecha y hora de la cita para calcular la penalización
    db.query('SELECT fecha, hora FROM citas WHERE id = ?', [cita_id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ mensaje: 'Cita no encontrada' });

        const cita = results[0];
        // Combinar fecha y hora para la comparación
        const fechaCita = new Date(cita.fecha);
        const [horas, minutos] = cita.hora.split(':');
        fechaCita.setHours(horas, minutos, 0);

        const ahora = new Date();
        const diferenciaHoras = (fechaCita - ahora) / (1000 * 60 * 60);

        // 2. Actualizar el estado a 'Cancelada'
        db.query('UPDATE citas SET estado = "Cancelada" WHERE id = ?', [cita_id], (errUpd) => {
            if (errUpd) return res.status(500).json({ mensaje: 'Error al procesar la cancelación' });

            // 3. Responder según el tiempo restante
            if (diferenciaHoras < 24) {
                res.status(200).json({ 
                    mensaje: 'Cita cancelada. Al faltar menos de 24 horas para la consulta, se ha aplicado una penalización en su cuenta.',
                    penalizacion: true 
                });
            } else {
                res.status(200).json({ mensaje: 'Cita cancelada con éxito sin penalizaciones.', penalizacion: false });
            }
        });
    });
});

// ==========================================
// RUTA CATCH-ALL PARA 404 (Debe ir al final)
// ==========================================
app.use((req, res, next) => {
    console.warn(`⚠️ Ruta no encontrada en Node.js: ${req.method} ${req.originalUrl}`);
    res.status(404).send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>La ruta solicitada no existe en el servidor Node.js.</p></body></html>');
});

app.listen(3000, () => {
    console.log('🚀 Servidor Backend corriendo en http://localhost:3000');
});