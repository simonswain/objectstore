# Objectstore

Objectstore is a database for storing Objects that can be related to each other.

You can use Objectstore either as a library in your own app, or run it as a REST server. Methods are exposed to allow you to control the server programatically, and a script to run it out of the box.

Objectstore uses Postgresql as it's backing database.

## Concept

Objectstore has Objects and Relationships

Objects have an id (a uuid generated by Objectstore), a type, and a slug.

Data for the objects is arbitrary JSON.

You can create (add) an object and update (set) it's JSON. The id and type are immutable.

You can create relationships between objects. The relationships have an optional role, expiration and position.

Some uses of relationships are

* parent-child, i.e a collection (use position for ordering)
* group membership with expiration
* control access to individual objects in a collection (use role for type of access)
* control access to objects based on relationship with another node (groups)
* confirm/deny a user has access to an object

You can find objects based on their type, relationships, and other parameters.

Use slugs to find named object, without using their id (e.g. looking up a user by username, looking up an item in a collection based on a url fragment)


## Quickstart

### Server

Clone the repo


### Node Module

npm install objectstore

var os = requre('objectstore');


## API

All methods take a callback that is called with err and result. The
signatures below use `next` to identify the callback.

### add

```javascript
var obj = {
  slug: 'my-slug',
  attrs: {}
}

There is no enforcement of unique slugs. You should check a slug is
available before using it. Typically you will use a slug in
conjunction with a parent-child relationship, to allow you to find an
object by name instead of id.

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

```json
{
  role: 'some-role',
  position: <integer>,
  expires: <date>
}
```

### get

Retrieve a single object

Get an object by id

```javascript
get(id, next)

Get an object by type, slug and parent.

```javascript
get(opts, next)

// opts are like
{
  id: '', // id of parent in relationship
  type: '', // type of object to look for
  slug: '', // slug to look for
}
```

If there is more than one object that matches, one will be returned at
random.


### find

Retrieve a set of objects

```javascript
find(opts, next)
```

Find objects by their type and relationships

`type`
type of objects to find

`id`
id of object they are related to

`role` role they are related with. Either a string literal or array of
strings. the relationship must be one of the elements of the array

`role_id` object role_id must have a relationship (if role is set, the
relationship must be of the given role) with id.

If that relationship exists, then objects of type that are related to
id (irrespective of role) are found.

Find is limited to a maximum of 100 returned items

`base` and `limit` parameters can be used in conjunction with `#count`
to effect paging.

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


query

{
 count:x
 objects: [x, x, x]
}


find :id :type (find types related to id) [:role]

get :id

set (no id = create, obj returned)
set :id (obj returned)

del :id




rel :id :rel_id [:role :position: :expires]

relate two objects


## Some Use cases

Users and groups

* create a user
* create a group
* add user to group
* give user role in group
find all users with role

create some items
grant access to some of the items to the group 
find items user x (having role y) can access

does user x have role y on item z


does user have 


create a collection
add an item
get all items
find item by slug


create some items
find items


