# Graphweaver Load Testing

In this package you will find a suite of load testing scripts that check the performance of Graphweaver under various load conditions.

## Running

To run the tests simply run:

```shell
pnpm test
```

## Updating K6

If you need to upgrade K6 (which is found in the `./bin/` dir) then follow these steps:

First make sure you have Go installed on your system.

```shell
go install go.k6.io/xk6/cmd/xk6@latest
```

This will install the xk6 builder and allow you to install extensions to `k6`. Then run:

```shell
xk6 build v0.52.0 --with github.com/grafana/xk6-ts 
```

Change the version with the one you are upgrading to. This will create a new `k6` binary file that can be moved to the `./bin` directory.