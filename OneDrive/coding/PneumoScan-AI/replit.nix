{ pkgs }: {
  deps = [
    pkgs.python39Full
    pkgs.gcc
    pkgs.libffi
    pkgs.openssl
    pkgs.zlib
    pkgs.sqlite
  ];
  env = {
    PYTHONHOME = "${pkgs.python39Full}";
    PYTHONBIN = "${pkgs.python39Full}/bin/python3.9";
    LANG = "en_US.UTF-8";
    LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath [
      pkgs.libffi
      pkgs.openssl
      pkgs.zlib
    ]}";
  };
}
