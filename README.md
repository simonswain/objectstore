# Objectstore

Version: 0.0.1 Initial Release

[![Build Status](https://travis-ci.org/simonswain/objectstore.png)](https://travis-ci.org/simonswain/objectstore)

Objectstore is a database for storing Objects that can be related to
each other.

It is designed to be a low-friction backing store for web apps that
need to implement structure and access control on collections of
objects.

You use Object store to hold all items (users, groups, documents,
whatever) your app needs.

Each item has a JSON blob for it's data.

You create relationships to structure connections between items, e.g.
join users in to a group, collect documents in to a folder.

Use Objectstore either as a library in your own app, or run it as a
REST server. Methods are exposed to allow you to control the server
programatically, and a script is provided to get it running it out of
the box.

Objectstore uses Postgresql as it's backend.

## Concept

Objectstore has Objects and Relationships.

The schema looks something like this:

```sql
obj (
  id uuid,
  type varchar(16),
  slug varchar(64),
  attrs json
);

rel (
  id uuid,
  rel_id uuid,
  type default null,
  role varchar(8)
);
```

Objects have an unique uuid `id` and an arbitrary `type`, both
assigned when created. The `slug` is optional.

An object's data (`attrs`) is a JSON blob. Probably best to keep this
as a simple key-value object.

`id` and `type` are immutable. Slugs can be changed.

You can `add` an object and `set` it's attrs. It's expected that attrs
will be completely overwritten each time, not have their individual
fields updated. Fetch an object, change some attrs, write the whole
thing back.

You can create a relationship (`rel`) between two object, with an
optional role, expiration and position.

You use relationships, types and roles to associate objects with each
other..

These relationships are the main reason Objectstore exists.

Some example uses are:

* A collection of objects in a container
* user/group membership with expiration
* users with roles in a group
* user role in group controlling access to items in a collection

Use slugs to find named objects without using their id (e.g. looking
up a user by username, looking up an item in a collection based on a
url fragment)

## Quickstart

### Node Module

```bash
npm install objectstore
```

See `config/index.sample.js` for an example of how the config object
should look.

```javascript
var os = require('objectstore').api(config);
os.add({type:'doc'}, next);
```

### Simple server

```bash
npm install objectstore
grunt reset
```

```javascript
var server = require('objectstore').server(config);
server.start(next);
```

### Standalone Server

Create database

```bash
sudo su - postgres
createuser -P os

createdb -O os os_dev
psql -c psql -d os_dev -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_test
psql -c psql -d os_test -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O os os_live
psql -c psql -d os_live -c 'CREATE EXTENSION "uuid-ossp";'
```

Clone the repo
```bash
git clone git@github.com:simonswain/objectstore.git
cd objectstore
npm install
cp config/index.sample.js config/index.js

# set database credentials
emacs config/index.js

# initialise the database
grunt reset
node server

info: Objectstore running on localhost:8002
```

## API

All methods take a callback that is called with err and result. The
signatures below use `next` to identify the callback.

### add

```javascript
var obj = {
  slug: 'my-slug',
  attrs: {}
}
```
There is no enforcement of unique slugs. You should check a slug is
available before using it. Typically you will use a slug in
conjunction with a parent-child relationship, to allow you to find an
object by name instead of id.

```
add(obj, next)
add(obj, rel, next)
add(obj, rels, next)
```

Callback returns the new object in it's result. The `id` field will be
added

### set

Normally used to set the attrs of an object. Can also be used to
change the slug of an object.

```javascript
set(id, attrs, next)

set(id, 'slug', '<new-slug-value>', next)
```

### rel

Creates a relationship between two objects

```javascript
rel(id, rel_id [, opts], next)
```
opts and all it's parameters are optional

```javascript
{
  role: 'some-role',
  position: <integer>,
  expires: <date>
}
```

### children

Retrieve related (rel_id) objects of a given node by their type

```javascript
children(id, type, next)
```

### parent

Retrieve parent (id) objects of a given node by the parent type

```javascript
parent(id, type, next)
```

### get

Retrieve a single object

Get an object by id

```javascript
get(id, next)
```

Get an object by id, ensuring it's a specific type

```javascript
get(id, type, next)
```

Get an object by type, slug and parent.

```javascript
get(opts, next)
```

opts are like:

```
{
  id: '', // id of parent in relationship
  type: '', // type of object to look for
  slug: '' // slug to look for
}
```

If there is more than one object that matches (e.g. by slug) one will
be returned at random, so you probably don't want to use this method
if that is possible. You'll need to ensure you're creating unique
entries.


### find

Retrieve a set of objects, based on their types and relationships.

```javascript
find(opts, next)
```

Find can traverse a list of types (provide them colon separated),
using relationships to find a list of objects related by a join object

`type`
type of objects to find

can be `<type>`, `<type:rel_type>`, `<rel_type:type:rel_type>`, and
reverses of those.

e.g.
`user` // all users
`doc` // all docs
`group` // all groups

`doc:image` // all images in a doc (id to rel_id -- parent-child)
`group:user` // all users in a group (id to rel_id -- multiparent-child)
`!user:group` // groups a user is in (rel_id to id -- parents by type)

`user:group:doc` // all docs a user can access (because the docs have
been shared to the group by a rel)

`!doc:group:user` // all users that can access a doc (by the doc's
relationship to the group, and user's relationship to the group)

`id`
id of the leftmost object in the type list. The right most objects
will be the ones found.

Find is limited to a maximum of 100 returned items. Use base and limit
to page through the entire found set,

`base` and `limit` parameters can be used in conjunction with `#count`
to effect paging.

The objects in the returned list of items will have a `roles` field
added to them, containing an array of roles that were found between
the first and second items objects in the type list. This is
equivalent to a user's role in a group.

You could reverse the types to find users whos can access a specific doc

e.g. `!doc:group:user`.

The `!` indicates this is reverse, and the roles will be taken from
the middle and last objects.


Find can also be used to find parent-child relationships and their
roles, by specifying two types in the list.

e.g `folder:doc` and `!doc:folder`


### count

Returns number of objects found using same query parameters as find.

### can

Can user object `role_id` perform action `role` on doc object `rel_id`
given membership of group object_id.

Can has the same semantics as `find` when with `role_id`, but is used to
check for permissions on a singly object.

`role` is optional.

```javascript
can (role_id, rel_id, id, role, next)
```

Callback returns true or false


## Rest API

```
GET /

{"objectstore":"0.0.1"}
```



```
GET /stats

{"objects":"0","relations":"0"}
```

```
POST /reset

HTTP/1.1 200 OK
```


### Create an Object

```
POST /objects
{"type": "doc"}


HTTP/1.1 200 OK
```

```
curl -i -X POST -H "Content-type: application/json" localhost:8002/objects -d '{"type": "doc"}'
```

```
HTTP/1.1 200 OK

{"type":"doc","id":"1eeaba49-4a74-4ea6-a98a-a6411fabe7ac"}
```


### Find Objects

```
GET /objects?type=some-type ...

HTTP/1.1 200 OK
```

Returns count of number matching the query, and array containing a
page of objects.

The query parameters are the same as the javascript api method.

```
curl -i -X GET -H "Content-type: application/json" localhost:8002/objects?type=doc
```

```
HTTP/1.1 200 OK

{
 count: 1,
 objects: [{"type":"doc","id":"1eeaba49-4a74-4ea6-a98a-a6411fabe7ac"}]
}
```

Default page is 100 objects starting at object zero. Use `base` and
`limit` to get different pages.


### Get an Object

```
GET /objects?type=some-type ...
```

Returns count of number matching the query, and array containing a
page of objects.

The query parameters are the same as the javascript api method.

```
curl -i -X GET -H "Content-type: application/json" localhost:8002/objects/1eeaba49-4a74-4ea6-a98a-a6411fabe7ac
```

```
HTTP/1.1 200 OK

{"type":"doc","id":"1eeaba49-4a74-4ea6-a98a-a6411fabe7ac"}
```


## Some usage examples

Users and groups

* create a user
* create a group
* add user to group
* give user role in group
* find all users with role
* create a folder and give group a role
* add a file to folder
* find which groups can access file based on it's folder
* find if a user can access a file, and with what role



## Release History

* 07/09/2014 0.0.0 Pre-alpha
* 07/10/2014 0.0.1 Initial release

## License

Copyright (c) 2014 Simon Swain

Licensed under the MIT license.
