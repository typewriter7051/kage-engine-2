let
    pkgs = import <nixpkgs> {};
in pkgs.mkShell {
    packages = [
        pkgs.nodejs_22
        pkgs.typescript
    ];
}
