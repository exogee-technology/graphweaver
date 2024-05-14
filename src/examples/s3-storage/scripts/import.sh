dropdb gw_storage_provider --force
createdb gw_storage_provider
psql -d gw_storage_provider -f database.sql