DROP TABLE IF EXISTS obj CASCADE;
DROP TABLE IF EXISTS rel CASCADE;

CREATE TABLE obj (
       id uuid primary key default uuid_generate_v4(),
       type varchar(16),
       slug varchar(64) default null,
       attrs json
);

CREATE TABLE rel (
       id uuid,
       rel_id uuid,
       role varchar(8) default null,
       expires timestamp default null,
       position integer default null       
);
