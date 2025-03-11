-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 03, 2025 at 12:28 PM
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

DROP PROCEDURE IF EXISTS `Route Creation SQL Template (DO NOT RUN)`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `Route Creation SQL Template (DO NOT RUN)` ()  MODIFIES SQL DATA COMMENT 'IFNOTEXISTS Morning/Afternoon 6:30am 4:00pm 150EGP' BEGIN
    INSERT INTO routes (price, trip_type, bus_id, route_name, time)
    SELECT 
        150.00 AS price,                -- Default price value
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

--
-- Dumping data for table `admin_users`
--

UPDATE `admin_users` SET `id` = 1,`username` = 'it',`password` = '123123',`created_at` = '2025-02-13 19:13:31' WHERE `admin_users`.`id` = 1;

--
-- Dumping data for table `buses`
--

UPDATE `buses` SET `id` = 1,`name` = 'Helwan Bus',`vacant_seats` = 2,`driver_mobile` = '01060994299' WHERE `buses`.`id` = 1;
UPDATE `buses` SET `id` = 2,`name` = 'Maadi Bus',`vacant_seats` = 2,`driver_mobile` = '01061102281' WHERE `buses`.`id` = 2;
UPDATE `buses` SET `id` = 3,`name` = 'Nasr City 1 Bus',`vacant_seats` = 2,`driver_mobile` = '01060971122' WHERE `buses`.`id` = 3;
UPDATE `buses` SET `id` = 4,`name` = 'Nasr City 2 Bus',`vacant_seats` = 2,`driver_mobile` = '01061107447' WHERE `buses`.`id` = 4;
UPDATE `buses` SET `id` = 5,`name` = 'Heliopolis 1 Bus',`vacant_seats` = 2,`driver_mobile` = '01061122839' WHERE `buses`.`id` = 5;
UPDATE `buses` SET `id` = 6,`name` = 'Heliopolis 2 Bus',`vacant_seats` = 2,`driver_mobile` = '01061122875' WHERE `buses`.`id` = 6;
UPDATE `buses` SET `id` = 7,`name` = 'Obour & Madinaty Bus',`vacant_seats` = 2,`driver_mobile` = '01061122104' WHERE `buses`.`id` = 7;
UPDATE `buses` SET `id` = 8,`name` = 'Shorouk & Badr Bus',`vacant_seats` = 2,`driver_mobile` = '01060933011' WHERE `buses`.`id` = 8;
UPDATE `buses` SET `id` = 9,`name` = 'Rehab City (Housing) Bus',`vacant_seats` = 2,`driver_mobile` = '01061122958' WHERE `buses`.`id` = 9;
UPDATE `buses` SET `id` = 10,`name` = 'Northern 90 Bus',`vacant_seats` = 2,`driver_mobile` = '01060933110' WHERE `buses`.`id` = 10;
UPDATE `buses` SET `id` = 11,`name` = '5th Settlement Bus',`vacant_seats` = 2,`driver_mobile` = '01061107211' WHERE `buses`.`id` = 11;
UPDATE `buses` SET `id` = 12,`name` = 'Ring Road Bus',`vacant_seats` = 2,`driver_mobile` = '01060912211' WHERE `buses`.`id` = 12;
UPDATE `buses` SET `id` = 13,`name` = 'Sheikh Zayed & 6 October Bus',`vacant_seats` = 2,`driver_mobile` = '01022662306' WHERE `buses`.`id` = 13;
UPDATE `buses` SET `id` = 14,`name` = 'Mokattam & Northern 90 Bus',`vacant_seats` = 2,`driver_mobile` = '01061019988' WHERE `buses`.`id` = 14;
UPDATE `buses` SET `id` = 15,`name` = 'Faisal & Mohandessin Bus',`vacant_seats` = 2,`driver_mobile` = '01010314412' WHERE `buses`.`id` = 15;
UPDATE `buses` SET `id` = 16,`name` = 'Rehab City Bus',`vacant_seats` = 2,`driver_mobile` = '01061122073' WHERE `buses`.`id` = 16;
UPDATE `buses` SET `id` = 17,`name` = '10th of Ramadan Bus',`vacant_seats` = 2,`driver_mobile` = '01061022115' WHERE `buses`.`id` = 17;

--
-- Dumping data for table `pickup_points`
--

UPDATE `pickup_points` SET `id` = 1,`route_id` = 2,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Helwan',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 1;
UPDATE `pickup_points` SET `id` = 2,`route_id` = 4,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Maadi',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 2;
UPDATE `pickup_points` SET `id` = 3,`route_id` = 6,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Nasr City 1',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 3;
UPDATE `pickup_points` SET `id` = 4,`route_id` = 8,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Nasr City 2',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 4;
UPDATE `pickup_points` SET `id` = 5,`route_id` = 10,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Heliopolis 1',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 5;
UPDATE `pickup_points` SET `id` = 6,`route_id` = 12,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Heliopolis 2',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 6;
UPDATE `pickup_points` SET `id` = 7,`route_id` = 14,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 7;
UPDATE `pickup_points` SET `id` = 8,`route_id` = 16,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 8;
UPDATE `pickup_points` SET `id` = 9,`route_id` = 18,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Rehab City (Housing)',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 9;
UPDATE `pickup_points` SET `id` = 10,`route_id` = 20,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Northern 90',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 10;
UPDATE `pickup_points` SET `id` = 11,`route_id` = 22,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = '5th Settlement',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 11;
UPDATE `pickup_points` SET `id` = 12,`route_id` = 24,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Ring Road',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 12;
UPDATE `pickup_points` SET `id` = 13,`route_id` = 26,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 13;
UPDATE `pickup_points` SET `id` = 14,`route_id` = 28,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 14;
UPDATE `pickup_points` SET `id` = 15,`route_id` = 30,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 15;
UPDATE `pickup_points` SET `id` = 16,`route_id` = 32,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = 'Rehab City',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 16;
UPDATE `pickup_points` SET `id` = 17,`route_id` = 34,`name` = 'U of Canada',`time` = '14:45:00',`route_name` = '10th of Ramadan',`trip_type` = 'From Campus' WHERE `pickup_points`.`id` = 17;
UPDATE `pickup_points` SET `id` = 32,`route_id` = 1,`name` = 'Central May',`time` = '06:35:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 32;
UPDATE `pickup_points` SET `id` = 33,`route_id` = 1,`name` = 'Maliha May',`time` = '06:45:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 33;
UPDATE `pickup_points` SET `id` = 34,`route_id` = 1,`name` = 'Golden Bread',`time` = '07:10:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 34;
UPDATE `pickup_points` SET `id` = 35,`route_id` = 1,`name` = 'Helwan University',`time` = '07:15:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 35;
UPDATE `pickup_points` SET `id` = 36,`route_id` = 1,`name` = 'Alawasty',`time` = '07:20:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 36;
UPDATE `pickup_points` SET `id` = 37,`route_id` = 1,`name` = 'Dar Al Muhandisin',`time` = '07:25:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 37;
UPDATE `pickup_points` SET `id` = 38,`route_id` = 1,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Helwan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 38;
UPDATE `pickup_points` SET `id` = 39,`route_id` = 3,`name` = 'Kornish Al-Madi',`time` = '06:40:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 39;
UPDATE `pickup_points` SET `id` = 40,`route_id` = 3,`name` = 'Hussein Sedki Mosque',`time` = '06:40:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 40;
UPDATE `pickup_points` SET `id` = 41,`route_id` = 3,`name` = 'Victoria Square',`time` = '06:45:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 41;
UPDATE `pickup_points` SET `id` = 42,`route_id` = 3,`name` = 'Arab El-Madi',`time` = '06:50:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 42;
UPDATE `pickup_points` SET `id` = 43,`route_id` = 3,`name` = 'Laselky',`time` = '06:55:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 43;
UPDATE `pickup_points` SET `id` = 44,`route_id` = 3,`name` = 'Nerko',`time` = '07:00:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 44;
UPDATE `pickup_points` SET `id` = 45,`route_id` = 3,`name` = 'Khair Zaman',`time` = '07:05:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 45;
UPDATE `pickup_points` SET `id` = 46,`route_id` = 3,`name` = 'Al Zahraa Supermarket',`time` = '07:10:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 46;
UPDATE `pickup_points` SET `id` = 47,`route_id` = 3,`name` = 'Kuwaiti Mosque',`time` = '07:10:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 47;
UPDATE `pickup_points` SET `id` = 48,`route_id` = 3,`name` = 'St 50',`time` = '07:15:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 48;
UPDATE `pickup_points` SET `id` = 49,`route_id` = 3,`name` = 'Becho City',`time` = '07:20:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 49;
UPDATE `pickup_points` SET `id` = 50,`route_id` = 3,`name` = 'UofCanada',`time` = '08:15:00',`route_name` = 'Maadi',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 50;
UPDATE `pickup_points` SET `id` = 51,`route_id` = 5,`name` = 'First Abbas',`time` = '06:55:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 51;
UPDATE `pickup_points` SET `id` = 52,`route_id` = 5,`name` = 'Gad - Abbas El-Akkad',`time` = '06:55:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 52;
UPDATE `pickup_points` SET `id` = 53,`route_id` = 5,`name` = 'Tharwat Market',`time` = '07:05:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 53;
UPDATE `pickup_points` SET `id` = 54,`route_id` = 5,`name` = 'Mahgoub - Makram Ebeid',`time` = '07:10:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 54;
UPDATE `pickup_points` SET `id` = 55,`route_id` = 5,`name` = 'El Sallab',`time` = '06:10:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 55;
UPDATE `pickup_points` SET `id` = 56,`route_id` = 5,`name` = 'Abu Dawad Al-Dhaheri',`time` = '07:15:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 56;
UPDATE `pickup_points` SET `id` = 57,`route_id` = 5,`name` = 'El-Burg Lap',`time` = '07:20:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 57;
UPDATE `pickup_points` SET `id` = 58,`route_id` = 5,`name` = 'Sultan',`time` = '07:20:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 58;
UPDATE `pickup_points` SET `id` = 59,`route_id` = 5,`name` = 'Al-Ferdous Housing',`time` = '07:25:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 59;
UPDATE `pickup_points` SET `id` = 60,`route_id` = 5,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Nasr City 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 60;
UPDATE `pickup_points` SET `id` = 61,`route_id` = 7,`name` = 'Al-Rashdan Mosque',`time` = '06:45:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 61;
UPDATE `pickup_points` SET `id` = 62,`route_id` = 7,`name` = 'Al-Mostafa Mosque',`time` = '06:45:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 62;
UPDATE `pickup_points` SET `id` = 63,`route_id` = 7,`name` = 'Al-Zohoor Club',`time` = '06:50:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 63;
UPDATE `pickup_points` SET `id` = 64,`route_id` = 7,`name` = 'Khedr El Touni',`time` = '06:50:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 64;
UPDATE `pickup_points` SET `id` = 65,`route_id` = 7,`name` = 'Waziri Aldifae',`time` = '06:50:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 65;
UPDATE `pickup_points` SET `id` = 66,`route_id` = 7,`name` = 'KFC Pilot',`time` = '06:55:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 66;
UPDATE `pickup_points` SET `id` = 67,`route_id` = 7,`name` = 'Al-Hay El-Sabae',`time` = '07:00:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 67;
UPDATE `pickup_points` SET `id` = 68,`route_id` = 7,`name` = 'Enpi - Zaker Husein',`time` = '07:05:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 68;
UPDATE `pickup_points` SET `id` = 69,`route_id` = 7,`name` = 'Mintaqah Altaseah',`time` = '07:05:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 69;
UPDATE `pickup_points` SET `id` = 70,`route_id` = 7,`name` = 'Vodafone 10th',`time` = '07:10:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 70;
UPDATE `pickup_points` SET `id` = 71,`route_id` = 7,`name` = 'Raihana',`time` = '07:10:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 71;
UPDATE `pickup_points` SET `id` = 72,`route_id` = 7,`name` = 'Al Zahraa Al Slab',`time` = '07:15:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 72;
UPDATE `pickup_points` SET `id` = 73,`route_id` = 7,`name` = 'Al Zahraa (Watanih)',`time` = '07:15:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 73;
UPDATE `pickup_points` SET `id` = 74,`route_id` = 7,`name` = 'Nakheel Gate',`time` = '07:20:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 74;
UPDATE `pickup_points` SET `id` = 75,`route_id` = 7,`name` = 'Al-Khazan',`time` = '07:25:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 75;
UPDATE `pickup_points` SET `id` = 76,`route_id` = 7,`name` = 'Al-Rehab Gate 9',`time` = '07:30:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 76;
UPDATE `pickup_points` SET `id` = 77,`route_id` = 7,`name` = 'Al-Rehab Gate 6',`time` = '07:30:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 77;
UPDATE `pickup_points` SET `id` = 78,`route_id` = 7,`name` = 'Al-Rehab Gate 1',`time` = '07:35:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 78;
UPDATE `pickup_points` SET `id` = 79,`route_id` = 7,`name` = 'Lotus',`time` = '07:40:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 79;
UPDATE `pickup_points` SET `id` = 80,`route_id` = 7,`name` = 'Mobil',`time` = '07:40:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 80;
UPDATE `pickup_points` SET `id` = 81,`route_id` = 7,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Nasr City 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 81;
UPDATE `pickup_points` SET `id` = 82,`route_id` = 9,`name` = 'Osman Bridge',`time` = '06:35:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 82;
UPDATE `pickup_points` SET `id` = 83,`route_id` = 9,`name` = 'Al-Sawah',`time` = '06:40:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 83;
UPDATE `pickup_points` SET `id` = 84,`route_id` = 9,`name` = 'Bisco Masr',`time` = '06:40:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 84;
UPDATE `pickup_points` SET `id` = 85,`route_id` = 9,`name` = 'Al-Central',`time` = '06:45:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 85;
UPDATE `pickup_points` SET `id` = 86,`route_id` = 9,`name` = 'Gesr El-Suez',`time` = '06:50:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 86;
UPDATE `pickup_points` SET `id` = 87,`route_id` = 9,`name` = 'El Tagneed',`time` = '06:55:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 87;
UPDATE `pickup_points` SET `id` = 88,`route_id` = 9,`name` = 'Haroun',`time` = '07:00:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 88;
UPDATE `pickup_points` SET `id` = 89,`route_id` = 9,`name` = 'El-Galaa',`time` = '07:05:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 89;
UPDATE `pickup_points` SET `id` = 90,`route_id` = 9,`name` = 'Masr Aviation Hospital',`time` = '07:10:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 90;
UPDATE `pickup_points` SET `id` = 91,`route_id` = 9,`name` = 'Almaza Central',`time` = '07:15:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 91;
UPDATE `pickup_points` SET `id` = 92,`route_id` = 9,`name` = '4.5 Bridge',`time` = '07:15:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 92;
UPDATE `pickup_points` SET `id` = 93,`route_id` = 9,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Heliopolis 1',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 93;
UPDATE `pickup_points` SET `id` = 94,`route_id` = 11,`name` = 'Ain Shams Bridge',`time` = '06:40:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 94;
UPDATE `pickup_points` SET `id` = 95,`route_id` = 11,`name` = 'Pedestrian Bridge',`time` = '06:45:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 95;
UPDATE `pickup_points` SET `id` = 96,`route_id` = 11,`name` = 'El-Ashrien Bridge',`time` = '06:50:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 96;
UPDATE `pickup_points` SET `id` = 97,`route_id` = 11,`name` = 'Al-Nady',`time` = '06:55:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 97;
UPDATE `pickup_points` SET `id` = 98,`route_id` = 11,`name` = 'Nozha Metro Station',`time` = '07:05:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 98;
UPDATE `pickup_points` SET `id` = 99,`route_id` = 11,`name` = 'Ammar Ibn Yasser',`time` = '07:15:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 99;
UPDATE `pickup_points` SET `id` = 100,`route_id` = 11,`name` = 'Tom & Basal',`time` = '07:15:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 100;
UPDATE `pickup_points` SET `id` = 101,`route_id` = 11,`name` = 'Amer Group',`time` = '07:20:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 101;
UPDATE `pickup_points` SET `id` = 102,`route_id` = 11,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Heliopolis 2',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 102;
UPDATE `pickup_points` SET `id` = 103,`route_id` = 13,`name` = 'Carrfour El-Obour',`time` = '06:40:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 103;
UPDATE `pickup_points` SET `id` = 104,`route_id` = 13,`name` = 'Square Amun',`time` = '06:40:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 104;
UPDATE `pickup_points` SET `id` = 105,`route_id` = 13,`name` = 'Nafaq 6',`time` = '06:40:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 105;
UPDATE `pickup_points` SET `id` = 106,`route_id` = 13,`name` = 'Square 5',`time` = '06:45:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 106;
UPDATE `pickup_points` SET `id` = 107,`route_id` = 13,`name` = 'Al Sherbiny Mosque',`time` = '06:45:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 107;
UPDATE `pickup_points` SET `id` = 108,`route_id` = 13,`name` = 'Janat Al Obour',`time` = '07:00:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 108;
UPDATE `pickup_points` SET `id` = 109,`route_id` = 13,`name` = 'BUE',`time` = '07:20:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 109;
UPDATE `pickup_points` SET `id` = 110,`route_id` = 13,`name` = 'Arabesque',`time` = '07:30:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 110;
UPDATE `pickup_points` SET `id` = 111,`route_id` = 13,`name` = 'City Club',`time` = '07:30:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 111;
UPDATE `pickup_points` SET `id` = 112,`route_id` = 13,`name` = 'El-Haraka Square',`time` = '07:35:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 112;
UPDATE `pickup_points` SET `id` = 113,`route_id` = 13,`name` = 'Al-Husseini Mosque',`time` = '07:40:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 113;
UPDATE `pickup_points` SET `id` = 114,`route_id` = 13,`name` = 'Season Mall',`time` = '07:45:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 114;
UPDATE `pickup_points` SET `id` = 115,`route_id` = 13,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Obour & Madinaty',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 115;
UPDATE `pickup_points` SET `id` = 116,`route_id` = 15,`name` = 'Al-Sherouq Central',`time` = '07:15:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 116;
UPDATE `pickup_points` SET `id` = 117,`route_id` = 15,`name` = 'El-Nahda Square',`time` = '07:20:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 117;
UPDATE `pickup_points` SET `id` = 118,`route_id` = 15,`name` = 'Dar Mise',`time` = '07:25:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 118;
UPDATE `pickup_points` SET `id` = 119,`route_id` = 15,`name` = 'Heliopolis Compound',`time` = '07:30:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 119;
UPDATE `pickup_points` SET `id` = 120,`route_id` = 15,`name` = 'Sun Square',`time` = '07:30:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 120;
UPDATE `pickup_points` SET `id` = 121,`route_id` = 15,`name` = 'Badr',`time` = '07:45:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 121;
UPDATE `pickup_points` SET `id` = 122,`route_id` = 15,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Shorouk & Badr',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 122;
UPDATE `pickup_points` SET `id` = 123,`route_id` = 17,`name` = 'Housing',`time` = '07:20:00',`route_name` = 'Rehab City (Housing)',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 123;
UPDATE `pickup_points` SET `id` = 124,`route_id` = 17,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Rehab City (Housing)',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 124;
UPDATE `pickup_points` SET `id` = 125,`route_id` = 19,`name` = 'Vitric Square',`time` = '07:00:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 125;
UPDATE `pickup_points` SET `id` = 126,`route_id` = 19,`name` = 'Downtown Mall',`time` = '07:05:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 126;
UPDATE `pickup_points` SET `id` = 127,`route_id` = 19,`name` = 'Mobil',`time` = '07:15:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 127;
UPDATE `pickup_points` SET `id` = 128,`route_id` = 19,`name` = 'Petros Port Club',`time` = '07:20:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 128;
UPDATE `pickup_points` SET `id` = 129,`route_id` = 19,`name` = 'EG Bank',`time` = '07:20:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 129;
UPDATE `pickup_points` SET `id` = 130,`route_id` = 19,`name` = 'Al-Baz Mosque',`time` = '07:20:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 130;
UPDATE `pickup_points` SET `id` = 131,`route_id` = 19,`name` = 'Al-Yasmeen',`time` = '07:25:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 131;
UPDATE `pickup_points` SET `id` = 132,`route_id` = 19,`name` = 'Bidayih',`time` = '07:25:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 132;
UPDATE `pickup_points` SET `id` = 133,`route_id` = 19,`name` = 'Lotus',`time` = '07:30:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 133;
UPDATE `pickup_points` SET `id` = 134,`route_id` = 19,`name` = 'Marasim',`time` = '07:40:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 134;
UPDATE `pickup_points` SET `id` = 135,`route_id` = 19,`name` = 'Balm Hales',`time` = '07:40:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 135;
UPDATE `pickup_points` SET `id` = 136,`route_id` = 19,`name` = 'Layan Compound',`time` = '07:45:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 136;
UPDATE `pickup_points` SET `id` = 137,`route_id` = 19,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 137;
UPDATE `pickup_points` SET `id` = 138,`route_id` = 21,`name` = 'Almanib',`time` = '06:15:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 138;
UPDATE `pickup_points` SET `id` = 139,`route_id` = 21,`name` = 'Emirates Gasoline',`time` = '06:30:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 139;
UPDATE `pickup_points` SET `id` = 140,`route_id` = 21,`name` = 'Al-Miraj',`time` = '06:40:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 140;
UPDATE `pickup_points` SET `id` = 141,`route_id` = 21,`name` = 'Adidas',`time` = '06:45:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 141;
UPDATE `pickup_points` SET `id` = 142,`route_id` = 21,`name` = 'Baron',`time` = '06:45:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 142;
UPDATE `pickup_points` SET `id` = 143,`route_id` = 21,`name` = 'Kattameya',`time` = '07:00:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 143;
UPDATE `pickup_points` SET `id` = 144,`route_id` = 21,`name` = 'Arbilla',`time` = '07:05:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 144;
UPDATE `pickup_points` SET `id` = 145,`route_id` = 21,`name` = 'Institution St.',`time` = '07:05:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 145;
UPDATE `pickup_points` SET `id` = 146,`route_id` = 21,`name` = 'Fatema El-Sharbatly',`time` = '07:10:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 146;
UPDATE `pickup_points` SET `id` = 147,`route_id` = 21,`name` = 'Al Mostafa Mosque',`time` = '07:10:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 147;
UPDATE `pickup_points` SET `id` = 148,`route_id` = 21,`name` = 'Al Mohand Mosque',`time` = '07:15:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 148;
UPDATE `pickup_points` SET `id` = 149,`route_id` = 21,`name` = 'Concord Plaza',`time` = '07:20:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 149;
UPDATE `pickup_points` SET `id` = 150,`route_id` = 21,`name` = 'AUC Gate 4',`time` = '07:30:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 150;
UPDATE `pickup_points` SET `id` = 151,`route_id` = 21,`name` = 'Lamar Compound',`time` = '07:35:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 151;
UPDATE `pickup_points` SET `id` = 152,`route_id` = 21,`name` = 'Igor Mall',`time` = '07:40:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 152;
UPDATE `pickup_points` SET `id` = 153,`route_id` = 21,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = '5th Settlement',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 153;
UPDATE `pickup_points` SET `id` = 154,`route_id` = 23,`name` = 'Mantay',`time` = '06:40:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 154;
UPDATE `pickup_points` SET `id` = 155,`route_id` = 23,`name` = 'Free Banha',`time` = '06:45:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 155;
UPDATE `pickup_points` SET `id` = 156,`route_id` = 23,`name` = 'Mustered',`time` = '06:55:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 156;
UPDATE `pickup_points` SET `id` = 157,`route_id` = 23,`name` = 'Othman',`time` = '07:00:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 157;
UPDATE `pickup_points` SET `id` = 158,`route_id` = 23,`name` = 'Marg',`time` = '07:05:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 158;
UPDATE `pickup_points` SET `id` = 159,`route_id` = 23,`name` = 'Al-Zakah',`time` = '07:15:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 159;
UPDATE `pickup_points` SET `id` = 160,`route_id` = 23,`name` = 'Al-Salam',`time` = '07:25:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 160;
UPDATE `pickup_points` SET `id` = 161,`route_id` = 23,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Ring Road',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 161;
UPDATE `pickup_points` SET `id` = 162,`route_id` = 25,`name` = 'Sheikh Zayed 3',`time` = '06:20:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 162;
UPDATE `pickup_points` SET `id` = 163,`route_id` = 25,`name` = 'Mall - Arabie',`time` = '06:25:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 163;
UPDATE `pickup_points` SET `id` = 164,`route_id` = 25,`name` = 'Football Association',`time` = '06:35:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 164;
UPDATE `pickup_points` SET `id` = 165,`route_id` = 25,`name` = 'Friday Market',`time` = '06:45:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 165;
UPDATE `pickup_points` SET `id` = 166,`route_id` = 25,`name` = 'Al-Ashgar',`time` = '06:50:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 166;
UPDATE `pickup_points` SET `id` = 167,`route_id` = 25,`name` = 'Gate 4 (Hadayek)',`time` = '06:50:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 167;
UPDATE `pickup_points` SET `id` = 168,`route_id` = 25,`name` = 'Helwan (Middle Ring Road)',`time` = '07:15:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 168;
UPDATE `pickup_points` SET `id` = 169,`route_id` = 25,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Sheikh Zayed & 6 October',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 169;
UPDATE `pickup_points` SET `id` = 170,`route_id` = 27,`name` = 'Modern University',`time` = '06:45:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 170;
UPDATE `pickup_points` SET `id` = 171,`route_id` = 27,`name` = 'El-Fountain Square',`time` = '07:00:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 171;
UPDATE `pickup_points` SET `id` = 172,`route_id` = 27,`name` = 'Mastoura Mosque',`time` = '07:10:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 172;
UPDATE `pickup_points` SET `id` = 173,`route_id` = 27,`name` = 'Etisalat',`time` = '07:10:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 173;
UPDATE `pickup_points` SET `id` = 174,`route_id` = 27,`name` = 'Arabella',`time` = '07:25:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 174;
UPDATE `pickup_points` SET `id` = 175,`route_id` = 27,`name` = 'Mivida',`time` = '07:35:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 175;
UPDATE `pickup_points` SET `id` = 176,`route_id` = 27,`name` = 'Hyde Park 1',`time` = '07:40:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 176;
UPDATE `pickup_points` SET `id` = 177,`route_id` = 27,`name` = 'Hyde Park 3',`time` = '07:40:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 177;
UPDATE `pickup_points` SET `id` = 178,`route_id` = 27,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Mokattam & Northern 90',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 178;
UPDATE `pickup_points` SET `id` = 179,`route_id` = 29,`name` = 'Lebanon Square',`time` = '06:10:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 179;
UPDATE `pickup_points` SET `id` = 180,`route_id` = 29,`name` = 'El Tawabek',`time` = '06:20:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 180;
UPDATE `pickup_points` SET `id` = 181,`route_id` = 29,`name` = 'El Talbia',`time` = '06:25:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 181;
UPDATE `pickup_points` SET `id` = 182,`route_id` = 29,`name` = 'Mohey El Dien Abo El Ezz',`time` = '06:35:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 182;
UPDATE `pickup_points` SET `id` = 183,`route_id` = 29,`name` = 'Coptic Hospital',`time` = '06:45:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 183;
UPDATE `pickup_points` SET `id` = 184,`route_id` = 29,`name` = 'Ghamaruh',`time` = '06:50:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 184;
UPDATE `pickup_points` SET `id` = 185,`route_id` = 29,`name` = 'Abbasiya',`time` = '06:55:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 185;
UPDATE `pickup_points` SET `id` = 186,`route_id` = 29,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Faisal & Mohandessin',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 186;
UPDATE `pickup_points` SET `id` = 187,`route_id` = 31,`name` = 'Shell',`time` = '07:00:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 187;
UPDATE `pickup_points` SET `id` = 188,`route_id` = 31,`name` = 'Ebdaa Square',`time` = '07:00:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 188;
UPDATE `pickup_points` SET `id` = 189,`route_id` = 31,`name` = 'A.T.M',`time` = '07:05:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 189;
UPDATE `pickup_points` SET `id` = 190,`route_id` = 31,`name` = 'Leila Compound',`time` = '07:05:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 190;
UPDATE `pickup_points` SET `id` = 191,`route_id` = 31,`name` = 'Water Way',`time` = '07:05:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 191;
UPDATE `pickup_points` SET `id` = 192,`route_id` = 31,`name` = 'Rehab Gate 13',`time` = '07:05:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 192;
UPDATE `pickup_points` SET `id` = 193,`route_id` = 31,`name` = 'Rehab Gate 16',`time` = '07:10:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 193;
UPDATE `pickup_points` SET `id` = 194,`route_id` = 31,`name` = 'Rehab Gate 17',`time` = '07:10:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 194;
UPDATE `pickup_points` SET `id` = 195,`route_id` = 31,`name` = 'Rehab Gate 19',`time` = '07:10:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 195;
UPDATE `pickup_points` SET `id` = 196,`route_id` = 31,`name` = 'Rehab Gate 20',`time` = '07:15:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 196;
UPDATE `pickup_points` SET `id` = 197,`route_id` = 31,`name` = 'Rehab Gate 22',`time` = '07:15:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 197;
UPDATE `pickup_points` SET `id` = 198,`route_id` = 31,`name` = 'Rehab Gate 23',`time` = '07:20:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 198;
UPDATE `pickup_points` SET `id` = 199,`route_id` = 31,`name` = 'Rehab Gate 24',`time` = '07:20:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 199;
UPDATE `pickup_points` SET `id` = 200,`route_id` = 31,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = 'Rehab City',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 200;
UPDATE `pickup_points` SET `id` = 201,`route_id` = 33,`name` = 'Dar Misr',`time` = '07:00:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 201;
UPDATE `pickup_points` SET `id` = 202,`route_id` = 33,`name` = 'Alardnih',`time` = '07:05:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 202;
UPDATE `pickup_points` SET `id` = 203,`route_id` = 33,`name` = 'Kubra Altilatih',`time` = '07:10:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 203;
UPDATE `pickup_points` SET `id` = 204,`route_id` = 33,`name` = 'Cleopatra Ceramic',`time` = '07:15:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 204;
UPDATE `pickup_points` SET `id` = 205,`route_id` = 33,`name` = 'El Rabiki',`time` = '07:45:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 205;
UPDATE `pickup_points` SET `id` = 206,`route_id` = 33,`name` = 'Badr Hospital',`time` = '07:50:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 206;
UPDATE `pickup_points` SET `id` = 207,`route_id` = 33,`name` = 'ERU',`time` = '07:50:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 207;
UPDATE `pickup_points` SET `id` = 208,`route_id` = 33,`name` = 'Monginis',`time` = '07:50:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 208;
UPDATE `pickup_points` SET `id` = 209,`route_id` = 33,`name` = 'Sobhy Hussien',`time` = '07:55:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 209;
UPDATE `pickup_points` SET `id` = 210,`route_id` = 33,`name` = 'U of Canada',`time` = '08:15:00',`route_name` = '10th of Ramadan',`trip_type` = 'To Campus' WHERE `pickup_points`.`id` = 210;

--
-- Dumping data for table `routes`
--

UPDATE `routes` SET `id` = 1,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 1,`route_name` = 'Helwan',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 1;
UPDATE `routes` SET `id` = 2,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 1,`route_name` = 'Helwan',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 2;
UPDATE `routes` SET `id` = 3,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 2,`route_name` = 'Maadi',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 3;
UPDATE `routes` SET `id` = 4,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 2,`route_name` = 'Maadi',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 4;
UPDATE `routes` SET `id` = 5,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 3,`route_name` = 'Nasr City 1',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 5;
UPDATE `routes` SET `id` = 6,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 3,`route_name` = 'Nasr City 1',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 6;
UPDATE `routes` SET `id` = 7,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 4,`route_name` = 'Nasr City 2',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 7;
UPDATE `routes` SET `id` = 8,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 4,`route_name` = 'Nasr City 2',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 8;
UPDATE `routes` SET `id` = 9,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 5,`route_name` = 'Heliopolis 1',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 9;
UPDATE `routes` SET `id` = 10,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 5,`route_name` = 'Heliopolis 1',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 10;
UPDATE `routes` SET `id` = 11,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 6,`route_name` = 'Heliopolis 2',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 11;
UPDATE `routes` SET `id` = 12,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 6,`route_name` = 'Heliopolis 2',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 12;
UPDATE `routes` SET `id` = 13,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 7,`route_name` = 'Obour & Madinaty',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 13;
UPDATE `routes` SET `id` = 14,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 7,`route_name` = 'Obour & Madinaty',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 14;
UPDATE `routes` SET `id` = 15,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 8,`route_name` = 'Shorouk & Badr',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 15;
UPDATE `routes` SET `id` = 16,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 8,`route_name` = 'Shorouk & Badr',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 16;
UPDATE `routes` SET `id` = 17,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 9,`route_name` = 'Rehab City (Housing)',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 17;
UPDATE `routes` SET `id` = 18,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 9,`route_name` = 'Rehab City (Housing)',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 18;
UPDATE `routes` SET `id` = 19,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 10,`route_name` = 'Northern 90',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 19;
UPDATE `routes` SET `id` = 20,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 10,`route_name` = 'Northern 90',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 20;
UPDATE `routes` SET `id` = 21,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 11,`route_name` = '5th Settlement',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 21;
UPDATE `routes` SET `id` = 22,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 11,`route_name` = '5th Settlement',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 22;
UPDATE `routes` SET `id` = 23,`price` = 150.00,`trip_type` = 'To Campus',`bus_id` = 12,`route_name` = 'Ring Road',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 23;
UPDATE `routes` SET `id` = 24,`price` = 150.00,`trip_type` = 'From Campus',`bus_id` = 12,`route_name` = 'Ring Road',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 24;
UPDATE `routes` SET `id` = 25,`price` = 200.00,`trip_type` = 'To Campus',`bus_id` = 13,`route_name` = 'Sheikh Zayed & 6 October',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 25;
UPDATE `routes` SET `id` = 26,`price` = 200.00,`trip_type` = 'From Campus',`bus_id` = 13,`route_name` = 'Sheikh Zayed & 6 October',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 26;
UPDATE `routes` SET `id` = 27,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 14,`route_name` = 'Mokattam & Northern 90',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 27;
UPDATE `routes` SET `id` = 28,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 14,`route_name` = 'Mokattam & Northern 90',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 28;
UPDATE `routes` SET `id` = 29,`price` = 170.00,`trip_type` = 'To Campus',`bus_id` = 15,`route_name` = 'Faisal & Mohandessin',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 29;
UPDATE `routes` SET `id` = 30,`price` = 170.00,`trip_type` = 'From Campus',`bus_id` = 15,`route_name` = 'Faisal & Mohandessin',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 30;
UPDATE `routes` SET `id` = 31,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 16,`route_name` = 'Rehab City',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 31;
UPDATE `routes` SET `id` = 32,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 16,`route_name` = 'Rehab City',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 32;
UPDATE `routes` SET `id` = 33,`price` = 140.00,`trip_type` = 'To Campus',`bus_id` = 17,`route_name` = '10th of Ramadan',`time` = '06:30:00',`status` = 'Active' WHERE `routes`.`id` = 33;
UPDATE `routes` SET `id` = 34,`price` = 140.00,`trip_type` = 'From Campus',`bus_id` = 17,`route_name` = '10th of Ramadan',`time` = '16:00:00',`status` = 'Active' WHERE `routes`.`id` = 34;

DELIMITER $$
--
-- Events
--
DROP EVENT IF EXISTS `Trip_Automation`$$
CREATE DEFINER=`root`@`localhost` EVENT `Trip_Automation` ON SCHEDULE EVERY 1 DAY STARTS '2025-01-17 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
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
