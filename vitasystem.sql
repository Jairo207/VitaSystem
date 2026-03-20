-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-03-2026 a las 17:43:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `vitasystem`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado` varchar(20) DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id`, `paciente_id`, `doctor_id`, `fecha`, `hora`, `estado`) VALUES
(1, 1, 1, '2026-03-20', '17:00:00', 'Pendiente'),
(2, 2, 13, '2026-03-28', '15:00:00', 'Pendiente'),
(3, 1, 19, '2026-03-13', '11:00:00', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctores`
--

CREATE TABLE `doctores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `especialidad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctores`
--

INSERT INTO `doctores` (`id`, `nombre`, `especialidad`) VALUES
(1, 'Dr. Roberto Gómez', 'Cardiología'),
(2, 'Dr. Juan Pablo', 'Cardiología'),
(3, 'Dra. Andrea Serna', 'Cardiología'),
(4, 'Dra. María Antonieta', 'Pediatría'),
(5, 'Dr. Pedro Vega', 'Pediatría'),
(6, 'Dra. Claudia Bahamón', 'Pediatría'),
(7, 'Dr. Rubén Aguirre', 'Odontología'),
(8, 'Dra. Betty Pinzón', 'Odontología'),
(9, 'Dra. Florinda Meza', 'Medicina General'),
(10, 'Dr. Armando Mendoza', 'Medicina General'),
(11, 'Dra. Marcela Valencia', 'Medicina General'),
(12, 'Dra. Ana Silva', 'Dermatología'),
(13, 'Dr. Nicolás Mora', 'Dermatología'),
(14, 'Dr. Luis Montes', 'Traumatología'),
(15, 'Dr. Hugo Lombardi', 'Traumatología'),
(16, 'Dra. Catalina Ángel', 'Traumatología'),
(17, 'Dr. Carlos Restrepo', 'Neurología'),
(18, 'Dra. Patricia Fernández', 'Neurología'),
(19, 'Dra. Sofia Vergara', 'Ginecología'),
(20, 'Dra. Ines Peña', 'Ginecología'),
(21, 'Dr. Alberto Pulmón', 'Neumología'),
(22, 'Dra. Laura Respiro', 'Neumología'),
(23, 'Dr. Carlos Huesos', 'Traumatología'),
(24, 'Dra. Marta Visión', 'Oftalmología'),
(25, 'Dr. Felipe Lentes', 'Oftalmología');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `nombre`, `cedula`, `correo`, `telefono`, `password`, `fecha_registro`) VALUES
(1, 'Jairo Alejandro', '12345', 'jairo.cardonag@cun.edu.co', '0987654321', '123', '2026-03-19 23:47:08'),
(2, 'pepe', '1234567890', 'jairorolando207@gmail.com', '3002187292', '321', '2026-03-19 23:51:41');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `doctores`
--
ALTER TABLE `doctores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cedula` (`cedula`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `doctores`
--
ALTER TABLE `doctores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctores` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
