# Federation Integration Tests

This directory holds the files needed to run the Federation Integration Tests.

To run the tests locally,

```
cd ..
pnpm test:integration
```

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

We currently only support single key attributes, however, all other tests pass.
