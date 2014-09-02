createdb -O os os_dev
psql -c psql -d os_dev -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_test
psql -c psql -d os_test -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_live
psql -c psql -d os_live -c 'CREATE EXTENSION "uuid-ossp";'
