let
    pkgs = import <nixpkgs> {};
in pkgs.mkShell {
    packages = [
        pkgs.spidermonkey_128
        pkgs.nodejs_22
    ];
}
