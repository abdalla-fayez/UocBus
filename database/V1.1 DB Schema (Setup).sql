-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 13, 2025 at 11:02 AM
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
DROP PROCEDURE IF EXISTS `debugonlyTrip_Creation`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `debugonlyTrip_Creation` ()  COMMENT 'TripGen with no weekend exclusion. (debugging)' BEGIN
    -- Generate trips for the next 2 days, excluding weekends
    INSERT INTO trips (bus_id, route_id, trip_date, available_seats, route_name, trip_type, trip_time)
    SELECT
        r.bus_id,
        r.id AS route_id,
        DATE_ADD(CURDATE(), INTERVAL n.num DAY) AS trip_date,
        (SELECT b.vacant_seats FROM buses b WHERE b.id = r.bus_id) AS available_seats,
        r.route_name AS route_name,
        r.trip_type AS trip_type,
        r.time AS trip_time
    FROM routes r
    CROSS JOIN (
        SELECT 1 AS num UNION SELECT 2
    ) n
    WHERE
    	r.status = 'Active' -- Only include Active routes
        AND NOT EXISTS (
            SELECT 1
            FROM trips t
            WHERE t.bus_id = r.bus_id
              AND t.route_id = r.id
              AND t.trip_date = DATE_ADD(CURDATE(), INTERVAL n.num DAY)
        );
END$$

DROP PROCEDURE IF EXISTS `PickUp Point Addition Template (DO NOT RUN)`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `PickUp Point Addition Template (DO NOT RUN)` ()  MODIFIES SQL DATA COMMENT 'Pickup points addition template for routes of type morning' INSERT INTO pickup_points (route_id, name, time)
SELECT r.id, p.name, p.time
FROM routes r
JOIN (
    SELECT 'Pickup Point Name' AS name, '00:00:00' AS time
    UNION ALL
    SELECT '', ''
    UNION ALL
    SELECT '', ''
    UNION ALL
    SELECT '', ''
    UNION ALL
    SELECT '', ''
    UNION ALL
    SELECT '', ''
    -- Add more pickup points as needed
) p ON r.route_name = 'The Route Name' AND r.trip_type = 'Morning'
WHERE NOT EXISTS (
    SELECT 1
    FROM pickup_points pp
    WHERE pp.route_id = r.id
      AND pp.name = p.name
      AND pp.time = p.time
)$$

DROP PROCEDURE IF EXISTS `Route_Creation`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `Route_Creation` ()  MODIFIES SQL DATA COMMENT 'IFNOTEXISTS Morning/Afternoon 6:30am 4:00pm 100EGP' BEGIN
    INSERT INTO routes (price, trip_type, bus_id, route_name, time)
    SELECT 
        100.00 AS price,                -- Default price value
        tt.trip_type,                 -- Either 'To Campus' or 'From Campus'
        b.id AS bus_id,               -- The bus's id from the buses table
        CASE 
            WHEN LOCATE(' Bus', b.name) > 0 THEN SUBSTRING_INDEX(b.name, ' Bus', 1)
            WHEN LOCATE(' bus', b.name) > 0 THEN SUBSTRING_INDEX(b.name, ' bus', 1)
            ELSE b.name
        END AS route_name,            -- Removes " Bus" or " bus" from the bus name
        CASE 
            WHEN tt.trip_type = 'To Campus' THEN '06:30:00'
            WHEN tt.trip_type = 'From Campus' THEN '16:00:00'
        END AS time
    FROM buses b
    CROSS JOIN (
        SELECT 'To Campus' AS trip_type
        UNION
        SELECT 'From Campus'
    ) tt
    WHERE NOT EXISTS (
        SELECT 1 
        FROM routes r 
        WHERE r.bus_id = b.id 
          AND r.trip_type = tt.trip_type
    );
END$$

DROP PROCEDURE IF EXISTS `Trip_Creation`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `Trip_Creation` ()  MODIFIES SQL DATA COMMENT 'Trip Generation Function' BEGIN
    -- Generate trips for the next 2 days, excluding weekends
    INSERT INTO trips (bus_id, route_id, trip_date, available_seats, route_name, trip_type, trip_time)
    SELECT
        r.bus_id,
        r.id AS route_id,
        DATE_ADD(CURDATE(), INTERVAL n.num DAY) AS trip_date,
        (SELECT b.vacant_seats FROM buses b WHERE b.id = r.bus_id) AS available_seats,
        r.route_name AS route_name,
        r.trip_type AS trip_type,
        r.time AS trip_time
    FROM routes r
    CROSS JOIN (
        SELECT 1 AS num UNION SELECT 2
    ) n
    WHERE
    	r.status = 'Active' -- Only include Active routes
        AND DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.num DAY)) NOT IN (6, 7) -- Exclude weekends
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
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `admin_users`:
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) NOT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `student_email` varchar(255) NOT NULL,
  `order_id` varchar(255) DEFAULT NULL,
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
  `vacant_seats` int(11) NOT NULL,
  `driver_mobile` varchar(15) DEFAULT NULL,
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
  KEY `payments_ibfk_1` (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `payments`:
--   `trip_id`
--       `trips` -> `id`
--

-- --------------------------------------------------------

--
-- Table structure for table `pickup_points`
--

DROP TABLE IF EXISTS `pickup_points`;
CREATE TABLE IF NOT EXISTS `pickup_points` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `time` time NOT NULL,
  `route_name` varchar(255) DEFAULT NULL,
  `trip_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pickup_points_ibfk_1` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `pickup_points`:
--   `route_id`
--       `routes` -> `id`
--

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
CREATE TABLE IF NOT EXISTS `routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `price` decimal(10,2) NOT NULL,
  `trip_type` enum('To Campus','From Campus') NOT NULL,
  `bus_id` int(11) NOT NULL,
  `route_name` varchar(255) NOT NULL,
  `time` time NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `fk_routes_bus` (`bus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- RELATIONSHIPS FOR TABLE `routes`:
--   `bus_id`
--       `buses` -> `id`
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
  `trip_time` time NOT NULL,
  `available_seats` int(11) NOT NULL,
  `route_name` varchar(255) NOT NULL,
  `trip_type` varchar(50) DEFAULT NULL,
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
-- Constraints for table `pickup_points`
--
ALTER TABLE `pickup_points`
  ADD CONSTRAINT `pickup_points_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `routes`
--
ALTER TABLE `routes`
  ADD CONSTRAINT `fk_routes_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`);

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
CREATE DEFINER=`root`@`localhost` EVENT `Trip_Automation` ON SCHEDULE EVERY 1 DAY STARTS '2025-01-17 00:00:00' ON COMPLETION PRESERVE DISABLE DO BEGIN
    -- Generate trips for the next 2 days, excluding weekends
    INSERT INTO trips (bus_id, route_id, trip_date, available_seats, route_name, trip_type, trip_time)
    SELECT
        r.bus_id,
        r.id AS route_id,
        DATE_ADD(CURDATE(), INTERVAL n.num DAY) AS trip_date,
        (SELECT b.vacant_seats FROM buses b WHERE b.id = r.bus_id) AS available_seats,
        r.route_name AS route_name,
        r.trip_type AS trip_type,
        r.time AS trip_time
    FROM routes r
    CROSS JOIN (
        SELECT 1 AS num UNION SELECT 2
    ) n
    WHERE
    	r.status = 'Active' -- Only include Active routes
        AND DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.num DAY)) NOT IN (6, 7) -- Exclude weekends
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
