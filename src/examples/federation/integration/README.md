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
_service FAIL
@key (single) FAIL
@key (multi) WARNING
@key (composite) WARNING
repeatable @key WARNING
@requires WARNING
@provides WARNING
federated tracing WARNING

*************
Federation v2 compatibility
*************
@link FAIL
@shareable WARNING
@tag WARNING
@override WARNING
@inaccessible WARNING
@composeDirective WARNING
@interfaceObject WARNING
```
