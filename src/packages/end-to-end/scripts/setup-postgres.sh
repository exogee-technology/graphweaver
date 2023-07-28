# createdb gw
# Wait for PostgreSQL to start
until psql -h localhost -U postgres -d gw -c "SELECT 1" &> /dev/null; do
    sleep 1
done

psql -U postgres -d gw -c "CREATE TABLE \"user\" (id BIGSERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, first_name VARCHAR(255), last_name VARCHAR(255));"
psql -U postgres -d gw -c "
  INSERT INTO \"user\" (username, password, first_name, last_name) VALUES
    ('user1', 'password1', 'John', 'Doe'),
    ('user2', 'password2', 'Jane', 'Smith'),
    ('user3', 'password3', 'Alice', 'Johnson'),
    ('user4', 'password4', 'Bob', 'Brown');
"
