# Federation Integration Tests

This directory holds the files needed to run the Federation Integration Tests.

To run the tests locally:

First make sure you are running the server in the example root:

```
cd ..
pnpm start
```

This will start the federation example on port 9001.

Once running you can:

```
npm i
npm test
```

The test suite will now be run against the server.

# Compatibility

We are aiming for v2 compatibility:

```
*************
Federation v1 compatibility
*************
_service PASS
@key (single) PASS
@key (multi) WARNING
@key (composite) WARNING
repeatable @key WARNING
@requires PASS
@provides PASS
federated tracing PASS

*************
Federation v2 compatibility
*************
@link PASS
@shareable PASS
@tag PASS
@override PASS
@inaccessible PASS
@composeDirective PASS
@interfaceObject PASS
```
