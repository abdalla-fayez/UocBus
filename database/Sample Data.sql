-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 02, 2025 at 02:34 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bus_ticketing`
--
CREATE DATABASE IF NOT EXISTS `bus_ticketing` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bus_ticketing`;

--
-- Truncate table before insert `buses`
--

TRUNCATE TABLE `buses`;
--
-- Dumping data for table `buses`
--

INSERT INTO `buses` (`id`, `name`, `vacant_seats`, `driver_mobile`) VALUES
(1, 'Obour Bus', 10, '0101'),
(2, 'Rehab Bus', 12, '0102'),
(3, 'Ring Road Bus', 14, '0103');

--
-- Truncate table before insert `pickup_points`
--

TRUNCATE TABLE `pickup_points`;
--
-- Dumping data for table `pickup_points`
--

INSERT INTO `pickup_points` (`id`, `route_id`, `name`, `time`) VALUES
(1, 1, 'City A Gate', '07:00:00'),
(2, 1, 'City A Dorms', '07:10:00'),
(3, 1, 'City A Library', '07:20:00'),
(4, 3, 'City B Gate', '07:00:00'),
(5, 3, 'City B Dorms', '07:10:00'),
(6, 3, 'City B Library', '07:20:00'),
(7, 5, 'City C Gate', '07:00:00'),
(8, 5, 'City C Dorms', '07:10:00'),
(9, 5, 'City C Library', '07:20:00'),
(10, 2, 'University', '16:00:00'),
(11, 4, 'University', '16:00:00'),
(12, 6, 'University', '16:00:00');

--
-- Truncate table before insert `routes`
--

TRUNCATE TABLE `routes`;
--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `price`, `trip_type`, `bus_id`, `route_name`, `time`, `status`) VALUES
(1, '', '', 0.10, 'Morning', 1, 'El Obour', '07:30:00', 'Active'),
(2, '', '', 0.10, 'Afternoon', 1, 'El Obour', '16:00:00', 'Active'),
(3, '', '', 0.10, 'Morning', 2, 'El Rehab', '07:30:00', 'Active'),
(4, '', '', 0.10, 'Afternoon', 2, 'El Rehab', '16:00:00', 'Active'),
(5, '', '', 0.10, 'Morning', 3, 'Ring Road', '07:30:00', 'Active'),
(6, '', '', 0.10, 'Afternoon', 3, 'Ring Road', '16:00:00', 'Active');

--
-- Truncate table before insert `trips`
--

TRUNCATE TABLE `trips`;
--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `bus_id`, `route_id`, `trip_date`, `trip_time`, `available_seats`, `route_name`, `trip_type`) VALUES
(1, 1, 1, '2025-01-19', '07:30:00', 10, 'El Obour', 'Morning'),
(2, 1, 1, '2025-01-20', '07:30:00', 10, 'El Obour', 'Morning'),
(3, 1, 1, '2025-01-21', '07:30:00', 8, 'El Obour', 'Morning'),
(4, 1, 1, '2025-01-22', '07:30:00', 10, 'El Obour', 'Morning'),
(5, 1, 1, '2025-01-23', '07:30:00', 10, 'El Obour', 'Morning'),
(6, 1, 2, '2025-01-19', '16:00:00', 10, 'El Obour', 'Afternoon'),
(7, 1, 2, '2025-01-20', '16:00:00', 0, 'El Obour', 'Afternoon'),
(8, 1, 2, '2025-01-21', '16:00:00', 10, 'El Obour', 'Afternoon'),
(9, 1, 2, '2025-01-22', '16:00:00', 10, 'El Obour', 'Afternoon'),
(10, 1, 2, '2025-01-23', '16:00:00', 0, 'El Obour', 'Afternoon'),
(11, 2, 3, '2025-01-19', '07:30:00', 12, 'El Rehab', 'Morning'),
(12, 2, 3, '2025-01-20', '07:30:00', 2, 'El Rehab', 'Morning'),
(13, 2, 3, '2025-01-21', '07:30:00', 12, 'El Rehab', 'Morning'),
(14, 2, 3, '2025-01-22', '07:30:00', 12, 'El Rehab', 'Morning'),
(15, 2, 3, '2025-01-23', '07:30:00', 12, 'El Rehab', 'Morning'),
(16, 2, 4, '2025-01-19', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(17, 2, 4, '2025-01-20', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(18, 2, 4, '2025-01-21', '16:00:00', 2, 'El Rehab', 'Afternoon'),
(19, 2, 4, '2025-01-22', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(20, 2, 4, '2025-01-23', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(21, 3, 5, '2025-01-19', '07:30:00', 14, 'Ring Road', 'Morning'),
(22, 3, 5, '2025-01-20', '07:30:00', 14, 'Ring Road', 'Morning'),
(23, 3, 5, '2025-01-21', '07:30:00', 14, 'Ring Road', 'Morning'),
(24, 3, 5, '2025-01-22', '07:30:00', 14, 'Ring Road', 'Morning'),
(25, 3, 5, '2025-01-23', '07:30:00', 14, 'Ring Road', 'Morning'),
(26, 3, 6, '2025-01-19', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(27, 3, 6, '2025-01-20', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(28, 3, 6, '2025-01-21', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(29, 3, 6, '2025-01-22', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(30, 3, 6, '2025-01-23', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(31, 1, 1, '2025-01-26', '07:30:00', 10, 'El Obour', 'Morning'),
(32, 1, 1, '2025-01-27', '07:30:00', 10, 'El Obour', 'Morning'),
(33, 1, 1, '2025-01-28', '07:30:00', 10, 'El Obour', 'Morning'),
(34, 1, 1, '2025-01-29', '07:30:00', 0, 'El Obour', 'Morning'),
(35, 1, 1, '2025-01-30', '07:30:00', 10, 'El Obour', 'Morning'),
(36, 1, 2, '2025-01-26', '16:00:00', 10, 'El Obour', 'Afternoon'),
(37, 1, 2, '2025-01-27', '16:00:00', 10, 'El Obour', 'Afternoon'),
(38, 1, 2, '2025-01-28', '16:00:00', 10, 'El Obour', 'Afternoon'),
(39, 1, 2, '2025-01-29', '16:00:00', 10, 'El Obour', 'Afternoon'),
(40, 1, 2, '2025-01-30', '16:00:00', 0, 'El Obour', 'Afternoon'),
(41, 2, 3, '2025-01-26', '07:30:00', 12, 'El Rehab', 'Morning'),
(42, 2, 3, '2025-01-27', '07:30:00', 12, 'El Rehab', 'Morning'),
(43, 2, 3, '2025-01-28', '07:30:00', 12, 'El Rehab', 'Morning'),
(44, 2, 3, '2025-01-29', '07:30:00', 12, 'El Rehab', 'Morning'),
(45, 2, 3, '2025-01-30', '07:30:00', 12, 'El Rehab', 'Morning'),
(46, 2, 4, '2025-01-26', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(47, 2, 4, '2025-01-27', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(48, 2, 4, '2025-01-28', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(49, 2, 4, '2025-01-29', '16:00:00', 2, 'El Rehab', 'Afternoon'),
(50, 2, 4, '2025-01-30', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(51, 3, 5, '2025-01-26', '07:30:00', 14, 'Ring Road', 'Morning'),
(52, 3, 5, '2025-01-27', '07:30:00', 14, 'Ring Road', 'Morning'),
(53, 3, 5, '2025-01-28', '07:30:00', 14, 'Ring Road', 'Morning'),
(54, 3, 5, '2025-01-29', '07:30:00', 14, 'Ring Road', 'Morning'),
(55, 3, 5, '2025-01-30', '07:30:00', 14, 'Ring Road', 'Morning'),
(56, 3, 6, '2025-01-26', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(57, 3, 6, '2025-01-27', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(58, 3, 6, '2025-01-28', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(59, 3, 6, '2025-01-29', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(60, 3, 6, '2025-01-30', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(61, 1, 1, '2025-01-31', '07:30:00', 10, 'El Obour', 'Morning'),
(62, 1, 1, '2025-02-01', '07:30:00', 10, 'El Obour', 'Morning'),
(63, 1, 2, '2025-01-31', '16:00:00', 10, 'El Obour', 'Afternoon'),
(64, 1, 2, '2025-02-01', '16:00:00', 10, 'El Obour', 'Afternoon'),
(65, 2, 3, '2025-01-31', '07:30:00', 12, 'El Rehab', 'Morning'),
(66, 2, 3, '2025-02-01', '07:30:00', 12, 'El Rehab', 'Morning'),
(67, 2, 4, '2025-01-31', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(68, 2, 4, '2025-02-01', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(69, 3, 5, '2025-01-31', '07:30:00', 14, 'Ring Road', 'Morning'),
(70, 3, 5, '2025-02-01', '07:30:00', 14, 'Ring Road', 'Morning'),
(71, 3, 6, '2025-01-31', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(72, 3, 6, '2025-02-01', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(76, 1, 1, '2025-02-02', '07:30:00', 10, 'El Obour', 'Morning'),
(77, 1, 2, '2025-02-02', '16:00:00', 10, 'El Obour', 'Afternoon'),
(78, 2, 3, '2025-02-02', '07:30:00', 12, 'El Rehab', 'Morning'),
(79, 2, 4, '2025-02-02', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(80, 3, 5, '2025-02-02', '07:30:00', 14, 'Ring Road', 'Morning'),
(81, 3, 6, '2025-02-02', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(83, 1, 1, '2025-02-03', '07:30:00', 10, 'El Obour', 'Morning'),
(84, 1, 2, '2025-02-03', '16:00:00', 10, 'El Obour', 'Afternoon'),
(85, 2, 3, '2025-02-03', '07:30:00', 12, 'El Rehab', 'Morning'),
(86, 2, 4, '2025-02-03', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(87, 3, 5, '2025-02-03', '07:30:00', 14, 'Ring Road', 'Morning'),
(88, 3, 6, '2025-02-03', '16:00:00', 14, 'Ring Road', 'Afternoon'),
(90, 1, 1, '2025-02-04', '07:30:00', 10, 'El Obour', 'Morning'),
(91, 1, 2, '2025-02-04', '16:00:00', 10, 'El Obour', 'Afternoon'),
(92, 2, 3, '2025-02-04', '07:30:00', 12, 'El Rehab', 'Morning'),
(93, 2, 4, '2025-02-04', '16:00:00', 12, 'El Rehab', 'Afternoon'),
(94, 3, 5, '2025-02-04', '07:30:00', 14, 'Ring Road', 'Morning'),
(95, 3, 6, '2025-02-04', '16:00:00', 14, 'Ring Road', 'Afternoon');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
