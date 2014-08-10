CREATE TABLE realtime (
    date timestamp without time zone,
    lat double precision,
    lon double precision,
    head double precision,
    fix integer,
    route text,
    stop integer,
    next integer,
    code integer
);

ALTER TABLE ONLY realtime
    ADD CONSTRAINT realtime_unique_record UNIQUE (date, lat, lon, route);
