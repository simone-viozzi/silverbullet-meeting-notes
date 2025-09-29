{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  name = "silverbullet-deno-dev";

  # Packages available in the shell environment
  packages = with pkgs; [
    deno # Deno JavaScript/TypeScript runtime
    nodejs # Node.js (sometimes needed for compatibility)
    git # Version control
    curl # For downloading dependencies
    jq # JSON processing tool
    uv
  ];

  # Environment variables
  DENO_DIR = "./.deno"; # Local Deno cache directory
  DENO_INSTALL_ROOT = "./.deno/bin"; # Local Deno install directory

  # Shell hook - commands executed when entering the shell
  shellHook = ''

    deno install -f --name silverbullet  --unstable-kv --unstable-worker-options -A https://get.silverbullet.md --global

    echo "🦕 Welcome to the SilverBullet Deno development environment!"
    echo ""
    echo "Available commands:"
    echo "  deno task build  - Build the plugin"
    echo "  deno task watch  - Build and watch for changes"  
    echo "  deno task test   - Run tests"
    echo ""
    echo "Deno version: $(deno --version | head -n1)"
    echo ""

    # Create local directories if they don't exist
    mkdir -p .deno .deno/bin

    # Add local deno bin to PATH for this session
    export PATH="$DENO_INSTALL_ROOT:$PATH"

    # Set up Deno cache in project directory
    echo "Deno cache directory: $DENO_DIR"
  '';
}
