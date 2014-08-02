## LoopBack Sample Application

This example application was scaffolded with the help of `yo loopback`. Refer
to the section [Building from scratch](building-from-scratch) below for more
details.

### i-Car Rentals Corp

i-Car is an (imaginary) car rental dealer with locations in major cities around
the world. They need to replace their existing desktop reservation system with
a new mobile app.

### End user experience

The app enables customers to find the closest available cars using the i-Car app
on a smartphone. The app shows a map of nearby rental locations and lists
available cars in the area shown on the map. In addition, the customer can
filter the list of cars by make, model, class, year and color. The customer can
then select the desired car and reserve it via the app. If not logged in the app
prompts the customer to login or register. The app indicates if the desired car
is available and if so, confirms the reservation.

### Features

 - Authenticates and verifies customers' identities.
 - Securely exposes inventory data to mobile applications.
 - Allow customers to find cars available **within a specific area**.
 - Allow customers to reserve cars for rental.

### REST APIs

 - `/cars` exposes a queryable (filter, sort) collection of available cars
    over HTTP / JSON
 - `/cars/nearby?&lat=...&long=... or ?zip=...` returns a filtered set of
    available cars nearby the requesting user
 - `/cars/nearby?id=24&zip=94555` returns nearby cars of id 24.
 - `/cars/:id` returns a specific car from the inventory, with specific
    pricing and images
 - `/users/login` allows a customer to login
 - `/users/logout` allows a customer to logout

### Configure and run the application

Start the application back-end by running the following command:

```
$ node .
```

Now open your browser and point it to
[http://127.0.0.1:3000](http://127.0.0.1:3000) to access the application UI.

#### Configuration

By default, the sample application uses the memory connector and listens on
the port 3000 on all network interfaces.

You can configure other data sources by adding a new key to `DATASTORES`
object in `rest/datasources.local.js`:

```js
var DATASTORES = {
  custom: {
    connector: 'my-custom-connector',
    // configuration for the custom connector
  },
  memory: {
  },
  // etc.
};
```

The sample can be configured using the following environment variables:

- `DB`: The db type, use `memory`, `mongodb` or `oracle`
- `IP`: The http server listener ip address or hostname, default to `0.0.0.0`
   (any address)
- `PORT`: The http server listener port number, default to `3000`

For example,

 - To run the application at port 3001 with MongoDB:

   ```
   $ DB=mongodb PORT=3001 node .
   ```

 - To run the application at port 3002 with Oracle:

  ```
   $ DB=oracle PORT=3002 node .
  ```


### Infrastructure

#### Customer Database

All customer information is available from the SalesForce API.

#### Inventory Database

All car inventory is already available in an **existing** Oracle X3-8 Exadata
database.

The Inventory DB schema looks like this:

##### **Customers**
 - id string
 - name string
 - username string
 - email string
 - password string
 - realm string
 - emailverified boolean
 - verificationtoken string
 - credentials string[]
 - challenges string[]
 - status string
 - created date
 - lastupdated date

##### **Reservations**
 - id string
 - product_id string
 - location_id string
 - customer_id string
 - qty number
 - status string
 - reserve_date date
 - pickup_date date
 - return_date date

##### **Inventory_Levels**
 - id string
 - product_id string
 - location_id string
 - available number
 - total number

##### **Car**
- id string
- vin string
- year number
- make string
- model string
- image string
- carClass string
- color string

##### **Location**
 - id string
 - street string
 - city string
 - zipcode string
 - name string
 - geo GeoPoint

##### **Inventory_View**

**View** to return qty of available products for the given city.

 - product (product name)
 - location (location name)
 - available (qty available)

#### Geo Lookup

Google's location API is used to return the users city from a given zip or lat/long.

### Project files

The project is composed from multiple components.

 - `models/` contains definition of models and implementation of custom model
   methods.

 - `rest/` contains the REST API server, it exposes the shared models
   via REST API.

 - `website/` contains a simple single-page-application that is served
  when users open the project in the browser.

 - `server/` is the main HTTP server that brings together all other components.

 - `sample-data/` contains a set of sample models that are used to initialize
  the database with some data.

 - `test/` provides few basic unit-tests to verify that the server provides
  the expected API.

Refer to
[Creating a LoopBack application](http://docs.strongloop.com/display/LB/Creating+a+LoopBack+application)
for more information.

### Building from scratch

Most of the sample application can be scaffolded using loopback's yeoman
generators. The generator module can be installed from npm:

```
$ npm install -g generator-loopback
```

Once you have the generators installed, run the following command to recreate
the sample app from scratch:

```
$ slc loopback:example -l
```

This will call other generators like `yo loopback` and `yo loopback:model`
to scaffold the application. You can learn more about these generators in our
documentation:
[Yeoman generators](http://docs.strongloop.com/display/LB/Yeoman+generators).

When run with the `-l` option, the example generator
prints a detailed list of steps that are executed to walk you trough the
scaffolding process. You can re-run the steps manually yourself to get a better
understanding of how the loopback generators work.

This is how the output looks like:

```
Create initial project scaffolding
  $ slc loopback:app loopback-example
    [?] Enter a directory name where to create the project: .
    [?] What's the name of your application? loopback-example


I'm all done. Just run npm install to install the required dependencies.


Add datasource geo
  $ slc loopback:datasource geo
    [?] Select the connector for geo: rest
  Set datasource options: operations
Add model Car
  $ slc loopback:model Car
    [?] Select the data-source to attach Car to: db
    [?] Expose Car via the REST API?
    [?] Property name:
  $ slc loopback:property
    [?] Select the model: Car
    [?] Enter the property name: id
    [?] Property type: string
    [?] Required? false
  Set property options: id
  (more properties follow in the output)
  Add relation Car hasMany Reservation
  Set model options: mysql mongodb oracle
Add model Customer
(and so on)
```

The first step is to prepare the project infrastructure by
running `slc loopback:app`, which is an alias for `slc loopback`.

Then there is a `geo` datasource added by running `slc loopback:datasource geo`.
When prompted for the connector to use, the `rest` is selected. After the
datasource was created, the REST operations are added to the generated
file `datasources.json` manually.

The next step is to create all application models. The generator
`slc loopback:model` is called to define a new model, `slc loopback:property` to
add a property definition to the new model. Some property options like
`"id": true` are not supported by the generator, they are added manually.

Also model relations and per-datasource model configurations are not supported
by the generator yet, as can be seen from these two lines:

```
  Add relation Car hasMany Reservation
  Set model options: mysql mongodb oracle
```

Open the file `models/car.json` too see what has been added by the generator.

When all models are defined, the example generator performs steps that you
would do manually when working on a new application: add more dependencies to
package.json, extend the models with custom behaviour, implement unit-tests,
etc.
