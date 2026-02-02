CREATE TABLE "user" (
	id bigint PRIMARY KEY NOT NULL,
	username character varying(255) UNIQUE NOT NULL,
	email character varying(255) UNIQUE NOT NULL
);


CREATE TABLE "task" (
	id bigint PRIMARY KEY NOT NULL,
	user_id bigint REFERENCES "user"(id),
	description text
);

CREATE TABLE "tag" (
	id bigint PRIMARY KEY NOT NULL,
	description text
);

CREATE TABLE "task_tag" (
	task_id bigint REFERENCES "task"(id) NOT NULL,
	tag_id bigint REFERENCES "tag"(id) NOT NULL,
	
	PRIMARY KEY(task_id, tag_id)
);