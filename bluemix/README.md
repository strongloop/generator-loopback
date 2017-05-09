If you have installed the [`cf` command-line tool])(https://docs.cloudfoundry.org/cf-cli/) and authenticated, `generator-loopback` will use the authentication details from `cf` for making requests to Bluemix. If not, use the `--login` or `--sso` option with the `bluemix` command to authenticate.

## The --bluemix option

The `--bluemix` option is available when scaffolding a new LoopBack app, adding a datasource, and creating a model.

### Scaffolding

When you specify the `--bluemix` option while scaffolding a LoopBack app, you will be presented with additional prompts for generating Bluemix app artifacts. With these files generated, your app is ready to be pushed to Bluemix for deployment.

```sh
yo loopback --bluemix
```

### Creating a data source

You can add data sources from Bluemix by specifying the `--bluemix` option.

```sh
yo loopback:datasource --bluemix
```

If you haven't authenticated, you will be prompted to authenticate when you try to add a datasource for the first time.

You will be presented with the list of data services provisioned on your Bluemix account. If you haven't already added one, you can add the services as data sources for your app. At present, only Cloudant and MongoDB services are supported. Support for more services will be added in future.

Without the `--bluemix` option, `yo loopback:datasource` behaves as usual.

### Creating a model

To create a model and bind it to a Bluemix datasource, specify the `--bluemix` option when running `yo loopback:model`.

```sh
yo loopback:model --bluemix
```

Note: you must add the Bluemix data source to your app using `yo loopback:datasource --bluemix`, before models can be bound to it.

## The bluemix command

The new `yo loopback bluemix` command lets you convert an existing LoopBack app to a Bluemix app. Execute the following command to generate Bluemix artifacts in an existing LoopBack app directory.

```sh
yo loopback:bluemix
```

You will be prompted for various options: respond according  to your requirements.

`yo loopback:bluemix` supports the following options to help you fine tune the generation of Bluemix artifacts:

`--docker` - generate Docker related files.
`--manifest` - generate or re-generate the `manifest.yml` file.
`--toolchain` - generate the Bluemix tool chain files.
`--login` - Log into Bluemix.
`--sso` - Log into Bluemix with SSO.
