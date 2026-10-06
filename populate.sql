-- ============================================================
-- SEED: persons
-- Fuente: Lista comunidad 10.xlsx
-- 41 adultos + 25 hijos
-- ============================================================


-- ============================================================
-- 1. ADULTOS
-- ============================================================

INSERT INTO persons (
    first_name,
    last_name,
    birth_date,
    email,
    phone,
    address
) VALUES
    ('Marcos', 'Manén Civil', '1991-09-02', 'marcos.manen@gmail.com', '629254443',
        'C. Ramon Más 6, 3º 5ª, Sant Cugat'),

    ('Teresa', 'Esteve Armenta', '1992-10-08', 'teresaesteve@uic.es', '660037942',
        NULL),

    ('Andrés', 'Marín Abad', '1989-03-31', 'marincodina@gmail.com', '613015063',
        'C. Cardenal Reig 18 Esc A 6-2, Barcelona'),

    ('Sara', 'Codina Lletjós', '1988-11-08', NULL, '677119001',
        NULL),

    ('Álvaro', 'Roca Lillo', '1989-02-07', 'roca.alvaro@hotmail.com', '617349240',
        'C. Ganduxer 107, 5º 3ª, Barcelona'),

    ('Miriam', 'Cusí Burgos-Bosch', '1988-05-08', 'miriam_cusi@hotmail.com', '682770413',
        NULL),

    ('David', 'Serra Altarejos', '1991-04-27', 'dserraal@gmail.com', '661416035',
        'Avinguda Barcelona 113, Esc. E, 1º 2ª, Sant Joan Despí'),

    ('Maria', 'Herrero Duran', '1998-03-04', 'herreroduranmaria@gmail.com', '611515255',
        NULL),

    ('Alejandro', 'Martín Encuentra', '1999-10-21', 'jandromaen@gmail.com', '688629688',
        'C. Palou 24 1º, Barcelona'),

    ('Álvaro', 'Cendoya Manén', '2000-07-03', 'alvaro55man@gmail.com', '625307180',
        'C. Regàs 8, 1º 3ª, Barcelona'),

    ('Anna', 'Jiménez Sánchez', '1999-10-23', 'annajimenezsanchez@hotmail.com', '692474011',
        NULL),

    ('Joan', 'Prat Jovaní', '1997-01-15', 'prat.manen@gmail.com', '693707475',
        'Carrer de la Sort 1, 1º 1ª, Sant Cugat del Vallés'),

    ('Ana', 'Manén Sala', '2000-03-15', NULL, '609501855',
        NULL),

    ('Andrés', 'Zaragoza Fernández', '1999-01-12', 'a.zaragoza.f@gmail.com', '666047934',
        'C. Bonaplata 51, Entresuelo 2ª Barcelona'),

    ('Bruno', 'Molas Gavira', '1998-12-03', 'brunomolas98@gmail.com', '633939309',
        'Plaza de Artos 11, 3° 1ª, Barcelona'),

    ('Clara', 'Campillo Foix', '2000-05-22', 'claracampillo3@gmail.com', '652821735',
        'C. Modolell 49, Bajos 1ª, Barcelona'),

    ('Cristina', 'Laucirica López-Palacios', '2000-12-31', 'crislauciricalp@gmail.com', '603790789',
        'C. Matilde Bertrán y Calopa 7, Bajos 2, Sant Feliu de Llobregat'),

    ('Diego', 'Pérez Manén', '2000-09-10', 'diego_perezmanen@hotmail.es', '673415676',
        'C. Mas Yebra 11, Entlo 1ª, Barcelona'),

    ('Dimitri', 'Zarzar', '1991-09-15', 'dimitrizarzar21@gmail.com', '611188778',
        NULL),

    ('Marta', 'Sansa Aizcorbe', '1993-10-05', 'sanaizcm@gmail.com', '659642978',
        NULL),

    ('Elena', 'Borrell Madurga', '1999-08-05', 'elenaborrellmadurga@hotmail.com', '717105320',
        'C. Doctor Roux 55, Bajo 1, Barcelona'),

    ('Elías', 'Marín Sotil', '2000-01-09', 'elias.marinsotil@gmail.com', '635956589',
        'C. Estapé 100, 2º 1ª, Sant Cugat del Vallés'),

    ('Guillem', 'Prat Jovani', '2000-05-11', 'gprat@la-farga.org', '684296769',
        'Pl. Barcelona 18, Sant Cugat del Vallés'),

    ('Guillermo', 'Boter Duran', '1998-11-24', 'boterguillermo@gmail.com', '727738686',
        'Pl. Joaquín Pena 14, 1º 1ª, Barcelona'),

    ('Javier', 'Infiesta Madurga', '1999-12-30', 'infijavier@gmail.com', '638963268',
        'C. Manel Girona 80, 9º A, Barcelona'),

    ('Joan', 'Jové', '1969-10-31', 'claudia71am@gmail.com', '686600863',
        'C. Albigesos 25, 1º 2ª, Barcelona'),

    ('Claudia', 'Amor', '1971-08-21', NULL, '606368966',
        NULL),

    ('Joan', 'Farran Villegas', '1990-10-04', 'joan.farran.villegas@gmail.com', '628131633',
        'C. Pintor Pradilla 29, 2º 4ª, Barcelona'),

    ('Rocío Anahí', 'Fretes Hermosa', '1995-04-24', 'rfretesh@gmail.com', '634716025',
        NULL),

    ('Lucía', 'Prat Jiménez', '2000-02-23', 'luciaprat13@gmail.com', '623105048',
        'C. de la Mare de Déu de la Salut, 75 bis, 1º 2ª, Barcelona'),

    ('Manuel María', 'Infiesta Burgos-Bosch', '2000-02-15', 'mibb@i-bb.es', '665306430',
        'Paseo San Juan Bosco 51, 2ºB, Barcelona'),

    ('Marina', 'Poo Navarro', '1991-04-04', 'marinatrasvia@hotmail.com', '658935242',
        'C. Mandoni 10, 5º 3ª, Barcelona'),

    ('Mateo', 'Manén Fernández', '1998-12-09', 'mmanenfr@gmail.com', '636972033',
        NULL),

    ('Teresa', 'Duran Foix', '1999-02-03', NULL, '609646850',
        NULL),

    ('Miquel', 'Codina Lletjós', '1993-08-12', 'm.codina.ll@gmail.com', '628306292',
        'C. Cal Ciso 58, 2º 1ª, Barcelona'),

    ('Maria', 'Ferreres Miralles', '1993-03-04', 'mferreresmiralles@gmail.com', '655098733',
        NULL),

    ('Myriam', 'Torres', '1984-12-09', 'myriamtorres84@gmail.com', '675611302',
        'Avinguda Lluís Companys 40, Esc. B, 3º 3ª, Sant Cugat del Vallès'),

    ('Pablo', 'Martín Encuentra', '2001-07-10', 'pablomaen@hotmail.com', '688728599',
        'C. Palou 24 1º, Barcelona'),

    ('Adrià', 'Vázquez Rodríguez', '1996-05-06', NULL, '617873403',
        'C. Vergós 12, 2º-4ª'),

    ('Paloma', 'García Fauquet', '1999-07-14', 'pgarciafauquet@gmail.com', '657347425',
        NULL),

    ('Sofía', 'Zaragoza Fernández', '2000-10-31', 'sofiazaragoza2000@gmail.com', '620803855',
        'C. Calatrava 16, 2º 1ª, Barcelona');


-- ============================================================
-- 2. CÓNYUGES
-- ============================================================
-- Se establecen en ambos sentidos.

UPDATE persons p
SET spouse_id = s.id
FROM persons s
WHERE (p.first_name, p.last_name, s.first_name, s.last_name) IN (

    ('Marcos', 'Manén Civil', 'Teresa', 'Esteve Armenta'),
    ('Teresa', 'Esteve Armenta', 'Marcos', 'Manén Civil'),

    ('Andrés', 'Marín Abad', 'Sara', 'Codina Lletjós'),
    ('Sara', 'Codina Lletjós', 'Andrés', 'Marín Abad'),

    ('Álvaro', 'Roca Lillo', 'Miriam', 'Cusí Burgos-Bosch'),
    ('Miriam', 'Cusí Burgos-Bosch', 'Álvaro', 'Roca Lillo'),

    ('David', 'Serra Altarejos', 'Maria', 'Herrero Duran'),
    ('Maria', 'Herrero Duran', 'David', 'Serra Altarejos'),

    ('Joan', 'Prat Jovaní', 'Ana', 'Manén Sala'),
    ('Ana', 'Manén Sala', 'Joan', 'Prat Jovaní'),

    ('Joan', 'Jové', 'Claudia', 'Amor'),
    ('Claudia', 'Amor', 'Joan', 'Jové'),

    ('Joan', 'Farran Villegas', 'Rocío Anahí', 'Fretes Hermosa'),
    ('Rocío Anahí', 'Fretes Hermosa', 'Joan', 'Farran Villegas'),

    ('Miquel', 'Codina Lletjós', 'Maria', 'Ferreres Miralles'),
    ('Maria', 'Ferreres Miralles', 'Miquel', 'Codina Lletjós')
);


-- ============================================================
-- 3. HIJOS
-- ============================================================
-- Los hijos no tienen dirección propia.
-- parent_id apunta a uno de los progenitores.
-- El otro progenitor se obtiene mediante parent.spouse_id.

INSERT INTO persons (
    first_name,
    last_name,
    birth_date,
    parent_id
)
SELECT
    child.first_name,
    NULL,
    child.birth_date::date,
    parent.id
FROM (
    VALUES
        ('Marta', '2017-09-25', 'Andrés', 'Marín Abad'),
        ('Mateo', '2018-08-28', 'Andrés', 'Marín Abad'),
        ('Catalina', '2019-12-14', 'Andrés', 'Marín Abad'),
        ('Paula', '2022-09-17', 'Andrés', 'Marín Abad'),
        ('Míriam', '2024-04-14', 'Andrés', 'Marín Abad'),

        ('María', '2018-07-21', 'Álvaro', 'Roca Lillo'),
        ('Manuel', '2020-09-25', 'Álvaro', 'Roca Lillo'),
        ('Amelia', '2022-01-28', 'Álvaro', 'Roca Lillo'),
        ('Miguel', '2023-12-01', 'Álvaro', 'Roca Lillo'),

        ('Pedro', '2023-09-27', 'David', 'Serra Altarejos'),

        ('Sofía', '2026-02-08', 'Joan', 'Prat Jovaní'),

        ('Nicolás Antonio', '2024-07-22', 'Dimitri', 'Zarzar'),
        ('Zyad Oscar', '2026-03-24', 'Dimitri', 'Zarzar'),

        ('Joan', '2002-06-25', 'Joan', 'Jové'),
        ('Claudia', '2002-06-25', 'Joan', 'Jové'),

        ('Álvaro', '2020-07-11', 'Joan', 'Farran Villegas'),
        ('Ignacio', '2022-03-24', 'Joan', 'Farran Villegas'),
        ('Guillermo', '2023-10-12', 'Joan', 'Farran Villegas'),

        ('Dylan', '2021-09-22', 'Marina', 'Poo Navarro'),

        ('Clara', '2019-05-18', 'Miquel', 'Codina Lletjós'),
        ('Francisco Javier', '2020-12-18', 'Miquel', 'Codina Lletjós'),
        ('Andreu', '2024-05-31', 'Miquel', 'Codina Lletjós'),

        ('Daniel', '2011-04-15', 'Myriam', 'Torres'),
        ('Pedro Pascual', '2015-08-23', 'Myriam', 'Torres'),

        ('Rodrigo', '2026-11-07', 'Adrià', 'Vázquez Rodríguez')

) AS child(first_name, birth_date, parent_first_name, parent_last_name)
JOIN persons parent
    ON parent.first_name = child.parent_first_name
   AND parent.last_name = child.parent_last_name;