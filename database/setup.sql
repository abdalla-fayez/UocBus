-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 16, 2024 at 01:22 PM
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

DELIMITER $$
--
-- Procedures
--
DROP PROCEDURE IF EXISTS `Trip_Automation`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `Trip_Automation` ()  MODIFIES SQL DATA BEGIN

    -- Step 1: Archive trips older than today
    INSERT INTO archived_trips (id, bus_id, route_id, trip_date, available_seats, route_name)
    SELECT id, bus_id, route_id, trip_date, available_seats, route_name
    FROM trips
    WHERE trip_date < CURDATE();

    -- Step 2: Archive bookings related to archived trips
    INSERT INTO archived_bookings (id, user_id, trip_id, seats_booked, payment_status, created_at, route_name)
    SELECT id, user_id, trip_id, seats_booked, payment_status, created_at, route_name
    FROM bookings
    WHERE trip_id IN (
        SELECT id
        FROM trips
        WHERE trip_date < CURDATE()
    );

    -- Step 3: Delete bookings related to archived trips
    DELETE FROM bookings
    WHERE trip_id IN (
        SELECT id
        FROM trips
        WHERE trip_date < CURDATE()
    );

    -- Step 4: Delete archived trips from the trips table
    DELETE FROM trips
    WHERE trip_date < CURDATE();

    -- Step 5: Generate trips for the next 30 days, excluding weekends
    INSERT INTO trips (bus_id, route_id, trip_date, available_seats, route_name)
    SELECT
        r.bus_id,
        r.id AS route_id,
        DATE_ADD(CURDATE(), INTERVAL n.num DAY) AS trip_date,
        (SELECT b.capacity FROM buses b WHERE b.id = r.bus_id) AS available_seats,
        r.route_name AS route_name
    FROM routes r
    CROSS JOIN (
        SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
    ) n
    WHERE
    DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.num DAY)) NOT IN (6, 7) -- Exclude weekends
    AND NOT EXISTS (
        SELECT 1
        FROM trips t
        WHERE t.bus_id = r.bus_id
          AND t.route_id = r.id
          AND t.trip_date = DATE_ADD(CURDATE(), INTERVAL n.num DAY)
    );

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `archived_trips`
--

DROP TABLE IF EXISTS `archived_trips`;
CREATE TABLE IF NOT EXISTS `archived_trips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bus_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `route_name` varchar(255) DEFAULT NULL,
  `trip_date` date NOT NULL,
  `available_seats` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bus_id` (`bus_id`),
  KEY `route_id` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `archived_trips`:
--   `bus_id`
--       `buses` -> `id`
--   `route_id`
--       `routes` -> `id`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) NOT NULL,
  `student_email` varchar(255) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `student_mobile_no` varchar(15) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `bookings`:
--   `order_id`
--       `payments` -> `order_id`
--

-- --------------------------------------------------------

--
-- Table structure for table `buses`
--

DROP TABLE IF EXISTS `buses`;
CREATE TABLE IF NOT EXISTS `buses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `buses`:
--

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(255) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `seats_booked` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `trip_id` (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `payments`:
--   `trip_id`
--       `trips` -> `id`
--

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
CREATE TABLE IF NOT EXISTS `routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `departure` varchar(255) NOT NULL,
  `arrival` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `trip_type` enum('morning','afternoon') NOT NULL,
  `bus_id` int(11) NOT NULL,
  `route_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `routes`:
--

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
CREATE TABLE IF NOT EXISTS `trips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bus_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `trip_date` date NOT NULL,
  `available_seats` int(11) NOT NULL,
  `route_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bus_id` (`bus_id`),
  KEY `route_id` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `trips`:
--   `bus_id`
--       `buses` -> `id`
--   `route_id`
--       `routes` -> `id`
--

--
-- Constraints for dumped tables
--

--
-- Constraints for table `archived_trips`
--
ALTER TABLE `archived_trips`
  ADD CONSTRAINT `archived_trips_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`),
  ADD CONSTRAINT `archived_trips_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`);

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `payments` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`);

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`),
  ADD CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`);

DELIMITER $$
--
-- Events
--
DROP EVENT IF EXISTS `Trip_Automation`$$
CREATE DEFINER=`root`@`localhost` EVENT `Trip_Automation` ON SCHEDULE EVERY 1 DAY STARTS '2024-12-09 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Step 1: Archive trips older than today
    INSERT INTO archived_trips (id, bus_id, route_id, trip_date, available_seats, route_name)
    SELECT id, bus_id, route_id, trip_date, available_seats, route_name
    FROM trips
    WHERE trip_date < CURDATE();

    -- Step 2: Archive bookings related to archived trips
    INSERT INTO archived_bookings (id, user_id, trip_id, seats_booked, payment_status, created_at, route_name)
    SELECT id, user_id, trip_id, seats_booked, payment_status, created_at, route_name
    FROM bookings
    WHERE trip_id IN (
        SELECT id
        FROM trips
        WHERE trip_date < CURDATE()
    );

    -- Step 3: Delete bookings related to archived trips
    DELETE FROM bookings
    WHERE trip_id IN (
        SELECT id
        FROM trips
        WHERE trip_date < CURDATE()
    );

    -- Step 4: Delete archived trips from the trips table
    DELETE FROM trips
    WHERE trip_date < CURDATE();

    -- Step 5: Generate trips for the next 30 days, excluding weekends
    INSERT INTO trips (bus_id, route_id, trip_date, available_seats, route_name)
    SELECT
        r.bus_id,
        r.id AS route_id,
        DATE_ADD(CURDATE(), INTERVAL n.num DAY) AS trip_date,
        (SELECT b.capacity FROM buses b WHERE b.id = r.bus_id) AS available_seats,
        r.route_name AS route_name
    FROM routes r
    CROSS JOIN (
        SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
    ) n
    WHERE
    DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.num DAY)) NOT IN (6, 7) -- Exclude weekends
    AND NOT EXISTS (
        SELECT 1
        FROM trips t
        WHERE t.bus_id = r.bus_id
          AND t.route_id = r.id
          AND t.trip_date = DATE_ADD(CURDATE(), INTERVAL n.num DAY)
    );
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
