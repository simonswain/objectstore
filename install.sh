createuser -P os

createdb -O os os_dev
psql -d os_dev -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_test
psql -d os_test -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_live
psql -d os_live -c 'CREATE EXTENSION "uuid-ossp";'
