'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';


// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('ok');
      setTimeout(() => setState('idle'), 1600);
    } catch { setState('err'); setTimeout(() => setState('idle'), 1600); }
  }
  return (
    <button onClick={copy} title="Copy to clipboard" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, border: state === 'ok' ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.14)', background: state === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: state === 'ok' ? '#34D399' : '#94A3B8', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em' }}>
      {state === 'ok'
        ? <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
        : <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v6.5A1.5 1.5 0 002.5 12H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Copy</>}
    </button>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; time?: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  pending: { label: 'Pending',   bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',   bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  'Setup':          { bg: '#EFF6FF', color: '#1D4ED8' },
  'Build':          { bg: '#F0FDF4', color: '#15803D' },
  'Deploy':         { bg: '#FFF7ED', color: '#C2410C' },
  'Best Practice':  { bg: '#FAF5FF', color: '#7E22CE' },
};

const PIPELINE_PHASES = [
  { label: 'Environment', ids: ['env', 'sdk', 'buildenv'] },
  { label: 'Build',       ids: ['uboot', 'kernel', 'dtb'] },
  { label: 'Bring-Up',   ids: ['patches', 'jtag', 'sdcard', 'boot', 'devloop'] },
  { label: 'Production', ids: ['yocto', 'ota', 'security', 'ci'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'env', phase: '01', title: 'Host Environment', status: 'done', tag: 'Setup', time: 'one-time setup',
    summary: 'Docker Desktop + QEMU x86_64 on Apple Silicon. Rosetta must be disabled.',
    sections: [
      {
        heading: 'Docker Desktop — disable Rosetta',
        body: 'Open Docker Desktop → Settings → General. Uncheck "Use Rosetta for x86/amd64 emulation on Apple Silicon." Rosetta has a .bss section size overflow bug that silently corrupts linked binaries — U-Boot SPL was the symptom. Use QEMU emulation only.',
      },
      {
        heading: 'Enter the build container',
        commands: [{ label: 'from macOS host', code: 'cd ~/ti-am62x\n./enter.sh' }],
        body: 'Ubuntu 22.04 x86_64. Workspace bind-mount: ~/ti-am62x/workspace (Mac) ↔ /workspace (container). Run all builds inside the container. Commits and pushes happen on the Mac host to preserve SSH credentials.',
      },
      {
        heading: 'Required packages',
        commands: [{ code: 'sudo apt install -y \\\n  swig python3-dev python3-setuptools \\\n  libgnutls28-dev uuid-dev libftdi-dev \\\n  libusb-1.0-0-dev libcap-dev libpython3-dev \\\n  pkg-config python3-yaml python3-pyelftools \\\n  python3-jsonschema python3-lxml\nsudo pip3 install yamllint' }],
        warnings: ['U-Boot 2025.01 requires these beyond stock Ubuntu 22.04. Missing swig causes cryptic Python import errors mid-build.'],
      },
    ],
  },
  {
    id: 'sdk', phase: '02', title: 'TI Processor SDK', status: 'done', tag: 'Setup', time: '~30 min download',
    summary: 'SDK v11.02.08.02 (2026 LTS). Downloaded separately (14 GB) — not committed to the repo.',
    sections: [
      {
        heading: 'SDK placement',
        body: 'The SDK installer lives outside git. Place it at ~/ti-am62x/workspace/sdk/ on the Mac before entering the container. The container sees it at /workspace/sdk/.',
        commands: [{ label: 'verify SDK root inside container', code: 'ls /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/' }],
      },
      {
        heading: 'Key SDK paths',
        table: {
          cols: ['Path (relative to SDK root)', 'Contents'],
          rows: [
            ['board-support/ti-linux-kernel-6.12.57+git-ti/', 'Linux kernel source'],
            ['board-support/u-boot-*/', 'U-Boot source'],
            ['board-support/prebuilt-images/am62xx-evm/', 'TI prebuilt reference binaries'],
            ['linux-devkit/.../aarch64-oe-linux/', 'A53 cross-compiler (gcc 13.4)'],
            ['k3r5-devkit/', 'R5F toolchain'],
            ['kernel-env.sh', 'Safe env helper — use this, not linux-devkit/environment-setup'],
          ],
        },
      },
    ],
  },
  {
    id: 'buildenv', phase: '03', title: 'Build Environment', status: 'done', tag: 'Setup', time: '< 5 min',
    summary: 'Source kernel-env.sh for kernel/U-Boot builds. Never use linux-devkit/environment-setup.',
    sections: [
      {
        heading: 'Environment setup — every session',
        commands: [
          { label: 'source the safe env helper', code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh\nexport KERNEL_SRC=/workspace/sdk/ti-processor-sdk-linux-am62xx-evm/board-support/ti-linux-kernel-6.12.57+git-ti' },
          { label: 'verify toolchain', code: 'aarch64-oe-linux-gcc --version\n# → aarch64-oe-linux-gcc (GCC) 13.4.0' },
        ],
        warnings: [
          'linux-devkit/environment-setup sets CC, CFLAGS, and CPATH to the aarch64 sysroot. This breaks HOSTCC and produces confusing failures mid-build. Never source it for kernel or U-Boot work.',
          'Open a separate shell for userspace builds. Never mix the two environments in one session.',
        ],
      },
    ],
  },
  {
    id: 'uboot', phase: '04', title: 'Bootloader (U-Boot)', status: 'done', tag: 'Build', time: '~60–90 min',
    summary: 'Builds tiboot3.bin (R5 SPL), tispl.bin (A53 SPL + ATF + OP-TEE), and u-boot.img.',
    sections: [
      {
        heading: 'Build',
        commands: [{ label: 'from SDK root', code: 'cd /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/\nmake MAKE_JOBS=$(nproc) u-boot' }],
        warnings: ['SDK Makefile defaults to MAKE_JOBS=1. Under QEMU this makes the build ~8× slower. Always override.'],
      },
      {
        heading: 'Artifacts',
        artifacts: [
          { file: 'board-support/u-boot-build/r5/tiboot3.bin', role: 'R5 SPL + signed TIFS firmware. ROM loads from SD sector offset.', size: '~400 KB' },
          { file: 'board-support/u-boot-build/a53/tispl.bin',  role: 'FIT image: A53 SPL + ATF (BL31) + OP-TEE (BL32) + DM firmware.', size: '~1.5 MB' },
          { file: 'board-support/u-boot-build/a53/u-boot.img', role: 'U-Boot proper, loaded by A53 SPL.', size: '~1 MB' },
        ],
      },
      {
        heading: 'Verify artifacts',
        commands: [{ code: 'file board-support/u-boot-build/r5/tiboot3.bin  # → data\nfile board-support/u-boot-build/a53/tispl.bin   # → FIT image\nfile board-support/u-boot-build/a53/u-boot.img  # → u-boot legacy image' }],
      },
    ],
  },
  {
    id: 'kernel', phase: '05', title: 'Linux Kernel + DTBs', status: 'done', tag: 'Build', time: '~45–60 min',
    summary: 'Kernel 6.12.57+git-ti. Produces Image (~22 MB) and k3-am62-lp-sk.dtb (~65 KB).',
    sections: [
      {
        heading: 'Configure and build',
        commands: [{ code: 'cd $KERNEL_SRC\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- defconfig\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- ti_arm64_prune.config\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- -j$(nproc) Image dtbs' }],
        artifacts: [
          { file: 'arch/arm64/boot/Image', role: 'Uncompressed kernel image.', size: '~22 MB' },
          { file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk.dtb', role: 'Device tree for SK-AM62-LP.', size: '~65 KB' },
        ],
        warnings: ['TI naming: k3-am62-lp-sk (not k3-am625-sk-lp). The wrong name fails silently at #include.'],
      },
    ],
  },
  {
    id: 'dtb', phase: '06', title: 'Custom Device Tree', status: 'done', tag: 'Build', time: '< 5 min',
    summary: 'Ambient overlay DTS at workspace/device-tree/. Idempotent build via custom Makefile.',
    sections: [
      {
        heading: 'Build',
        commands: [{ label: 'inside container', code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh\nexport KERNEL_SRC=<sdk-root>/board-support/ti-linux-kernel-6.12.57+git-ti\ncd /workspace/device-tree\nmake build KERNEL_SRC=$KERNEL_SRC' }],
        artifacts: [{ file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk-ambient.dtb', role: 'Ambient overlay DTB. Select via fdtfile or extlinux.conf when ready.', size: '~65 KB' }],
        warnings: [
          'Use exact-line awk matching for DT Makefile insertion — substring sed inserts duplicates on every run.',
          'Production OSD62x-PM DTB needs the Octavo DDR device-tree config (github.com/octavosystems/osd62-pm-ddr), not SK-AM62-LP DDR settings.',
        ],
      },
    ],
  },
  {
    id: 'patches', phase: '07', title: 'Kernel Patch Management', status: 'pending', tag: 'Best Practice', time: 'reference',
    summary: 'Never modify the TI kernel tree directly. Use patches/ and git format-patch so changes survive SDK updates.',
    sections: [
      {
        heading: 'Why this matters',
        body: 'The TI SDK ships a snapshot of their kernel fork. A direct edit to the TI tree is gone when you upgrade to the next SDK release. Patch series survive upgrades and can be reviewed independently of vendor changes.',
      },
      {
        heading: 'Creating and applying patches',
        commands: [
          { label: 'create a patch from a kernel commit', code: 'cd $KERNEL_SRC\n# Make your change, commit it in the TI kernel git tree\ngit format-patch -1 HEAD -o /workspace/patches/\n# produces: 0001-ambient-your-change.patch' },
          { label: 'apply all patches (e.g. after SDK upgrade)', code: 'cd $KERNEL_SRC\ngit am /workspace/patches/*.patch' },
          { label: 'dry-run check before applying', code: 'git apply --check /workspace/patches/0001-ambient-*.patch' },
        ],
        warnings: [
          'After a SDK upgrade, use "git am --3way" to resolve conflicts. If a TI patch changes the same hunk as yours, resolve manually and update the patch with "git format-patch -1 HEAD".',
          'Naming convention: NNNN-ambient-<subsystem>-<description>.patch. Keep indices sequential.',
        ],
      },
    ],
  },
  {
    id: 'jtag', phase: '08', title: 'JTAG / Hardware Debug', status: 'pending', tag: 'Best Practice', time: '~1 hr setup',
    summary: 'XDS110 on SK-AM62-LP gives hardware breakpoints and CPU register access before the OS boots.',
    sections: [
      {
        heading: 'Hardware setup',
        body: 'The SK-AM62-LP has an onboard XDS110 emulator on connector J15 (separate micro-USB from the UART debug port). Connect both: UART for console output, JTAG for debug control. Power the board first, then connect the JTAG USB.',
      },
      {
        heading: 'OpenOCD + GDB',
        commands: [
          { label: 'start OpenOCD server', code: 'openocd -f interface/ti_xds110.cfg -f target/ti_am625.cfg' },
          { label: 'connect GDB in a second terminal', code: 'aarch64-oe-linux-gdb vmlinux\n(gdb) target extended-remote :3333\n(gdb) monitor reset halt\n(gdb) continue' },
        ],
      },
      {
        heading: 'Essential debug techniques',
        checklist: [
          'Set hardware breakpoints before kernel init to catch early panics: hbreak start_kernel',
          'Inspect DTB in memory: x/40xw 0x88000000 (typical DTB load address)',
          'Read UART status registers directly to debug silent-boot issues without console',
          'JTAG works even when the board appears completely hung — always try JTAG before re-burning SD',
          'R5 core debug: CCS can attach to both R5 and A53 clusters simultaneously. Attach R5 to debug DDR training failures before the A53 is running.',
        ],
      },
    ],
  },
  {
    id: 'sdcard', phase: '09', title: 'SD Card Preparation', status: 'pending', tag: 'Deploy', time: '~10 min',
    summary: 'MBR + FAT32 boot (256 MB) + ext4 rootfs. Hardware on order.',
    sections: [
      {
        heading: 'Identify and partition',
        commands: [
          { label: 'macOS — VERIFY size matches card before writing', code: 'diskutil list\ndiskutil unmountDisk /dev/diskN\nsudo dd if=/dev/zero of=/dev/rdiskN bs=1m count=16 conv=fsync\nsudo newfs_msdos -F 32 -v BOOT /dev/rdiskNs1' },
          { label: 'inside container — format rootfs partition', code: 'sudo mkfs.ext4 -L rootfs /dev/sdXN2' },
        ],
        warnings: ['Writing to the wrong device destroys data. Double-check diskN every time.'],
      },
      {
        heading: 'Copy boot artifacts',
        commands: [
          { label: 'macOS — FAT partition mounts as /Volumes/BOOT', code: 'cp deploy/tiboot3.bin        /Volumes/BOOT/\ncp deploy/tispl.bin         /Volumes/BOOT/\ncp deploy/u-boot.img        /Volumes/BOOT/\ncp deploy/Image             /Volumes/BOOT/\ncp deploy/k3-am625-sk-lp.dtb /Volumes/BOOT/\nsync && diskutil unmountDisk /dev/diskN' },
          { label: 'inside container — populate rootfs', code: 'sudo tar -xpf deploy/tisdk-default-image-am62xx-evm.tar.xz \\\n  -C /mnt/sdcard-rootfs\nsudo sync && sudo umount /mnt/sdcard-rootfs' },
        ],
        warnings: ['Filenames are exact. ROM looks for tiboot3.bin. A53 SPL looks for tispl.bin and u-boot.img.', 'Always sync before unmounting. Power-off without sync is the leading cause of SD card corruption.'],
      },
    ],
  },
  {
    id: 'boot', phase: '10', title: 'First Boot', status: 'pending', tag: 'Deploy', time: '~30 min',
    summary: 'Boot chain: ROM → tiboot3 → tispl → u-boot → kernel → rootfs. Serial console 115200 8N1.',
    sections: [
      {
        heading: 'Open the serial console',
        commands: [{ label: 'macOS — use the higher-numbered tty.usbmodem* device', code: 'ls /dev/tty.usb*\ntio /dev/tty.usbmodemXXXXXX3 -b 115200\n# 115200 8N1, no flow control' }],
        body: 'Set SW1 to SD boot — verify against the board QSG, not from memory. Insert SD card. Connect USB-C to XDS110 UART port (J18). Connect power last.',
      },
      {
        heading: 'Expected boot chain',
        table: {
          cols: ['Stage', 'Who runs', 'Expected output', 'Failure signal'],
          rows: [
            ['1', 'ROM → tiboot3.bin', '"U-Boot SPL … Trying to boot from MMC2"', 'Silence → wrong boot mode or SD unreadable'],
            ['2', 'tiboot3 → tispl.bin', '"Loading fit image from MMC"', 'Hang → DDR training or tispl.bin missing'],
            ['3', 'A53 SPL → U-Boot', '"CPU: AM62X SR1.0 HS-FS … Hit any key"', 'Hang → u-boot.img or ATF/OP-TEE crash'],
            ['4', 'U-Boot → kernel', '"Starting kernel … Booting Linux on CPU 0x0"', '"Bad Linux ARM64 Image magic!" → DTB/kernel swap'],
            ['5', 'Rootfs + systemd', '"am62xx-evm login:"', 'VFS panic → check root= bootarg, mmcblk0 vs 1'],
          ],
        },
      },
      {
        heading: 'Success criteria and capture',
        commands: [
          { label: 'capture full boot log for the record', code: 'tio /dev/tty.usbmodemXXXXXX3 -b 115200 -l -L first-boot.log' },
          { label: 'verify after boot', code: 'uname -a                        # shows built kernel\ncat /proc/device-tree/model     # → SK-AM62-LP string\nls /sys/class/net               # → lo + eth0\ndmesg | grep -i error           # should be clean' },
        ],
        warnings: [
          'mmcblk1 vs mmcblk0: eMMC enumerates before SD. Check with "mmc list" from U-Boot shell if kernel panics on rootfs mount.',
          'Linux console is ttyS2 for AM62x. Bootargs must include console=ttyS2,115200n8.',
          'Snapshot the working SD immediately: sudo dd if=/dev/diskN of=golden-sd.img bs=1m',
        ],
      },
    ],
  },
  {
    id: 'devloop', phase: '11', title: 'TFTP / NFS Dev Loop', status: 'pending', tag: 'Best Practice', time: '~20 min setup',
    summary: 'Load kernel + DTB over TFTP, mount rootfs over NFS. Cuts iteration from 10 min to under 60 sec.',
    sections: [
      {
        heading: 'Mac host setup',
        commands: [
          { label: 'enable macOS TFTP server', code: 'sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist\n# TFTP root: /private/tftpboot/\ncp $KERNEL_SRC/arch/arm64/boot/Image /private/tftpboot/\ncp $KERNEL_SRC/arch/arm64/boot/dts/ti/k3-am62-lp-sk.dtb /private/tftpboot/' },
        ],
      },
      {
        heading: 'U-Boot environment',
        commands: [{ label: 'set once at U-Boot prompt — survives reboots', code: "setenv serverip 192.168.1.100\nsetenv ipaddr   192.168.1.101\nsetenv bootargs 'console=ttyS2,115200n8 root=/dev/nfs nfsroot=192.168.1.100:/path/to/rootfs rw'\nsetenv bootcmd 'tftpboot 0x82000000 Image; tftpboot 0x88000000 k3-am62-lp-sk.dtb; booti 0x82000000 - 0x88000000'\nsaveenv" }],
      },
    ],
  },
  {
    id: 'yocto', phase: '12', title: 'Yocto Production Image', status: 'pending', tag: 'Best Practice', time: '12–20 hrs (cloud VM)',
    summary: 'tisdk default for bring-up. Production uses meta-ambient Yocto layer with Mender integration and Python 3.11.',
    sections: [
      {
        heading: 'Why Yocto for production',
        body: 'The tisdk default rootfs includes dev tools and test utilities with no place in a deployed device. A custom Yocto layer gives precise control over the package set, reproducible builds tied to a specific commit, and a clean audit trail of every included binary.',
      },
      {
        heading: 'Yocto build environment',
        body: 'Full builds take 12–20+ hours under QEMU. Use a cloud x86_64 Linux VM (16+ cores, 32 GB RAM) for production builds. Set DL_DIR and SSTATE_DIR to shared storage so the build cache persists across VM instances.',
        commands: [
          { label: 'clone TI Yocto layers', code: 'git clone https://git.ti.com/cgit/arago-project/oe-layersetup.git\ncd oe-layersetup\n./oe-layersetup.sh -f configs/arago/arago-sdk-11.02.08.02.conf' },
          { label: 'add meta-ambient layer and build', code: '# Add to bblayers.conf:\nBBLAYERS += "/workspace/meta-ambient"\n\n# Add to local.conf:\nINHERIT += "mender-full"\nMENDER_ARTIFACT_NAME = "ambient-${PV}-${DATETIME}"\n\n. oe-init-build-env\nbitbake ambient-image' },
        ],
        warnings: ['First Yocto build should be on a cloud VM with the sstate-cache on persistent shared storage — it cuts subsequent build times from 12+ hours to under 30 minutes.'],
      },
      {
        heading: 'meta-ambient layer structure',
        table: {
          cols: ['Path', 'Contents'],
          rows: [
            ['recipes-core/ambient-image/', 'Top-level image recipe — package list, IMAGE_FEATURES'],
            ['recipes-ambient/ambientapp/', 'Python app recipe — installs to /var/lib/ambient'],
            ['recipes-bsp/device-tree/', 'Pulls in workspace/device-tree DTS via SRC_URI'],
            ['recipes-connectivity/wifi/', 'Murata 1YN / CYW43xx firmware + wpa_supplicant config'],
            ['conf/layer.conf', 'Layer metadata, LAYERDEPENDS'],
          ],
        },
      },
    ],
  },
  {
    id: 'ota', phase: '13', title: 'OTA Updates (Mender)', status: 'pending', tag: 'Best Practice', time: 'reference',
    summary: 'Mender hosted with A/B rootfs. Atomic, rollback-capable updates for OS/kernel, radar firmware, and app layer.',
    sections: [
      {
        heading: 'Partition layout (16 GB eMMC)',
        table: {
          cols: ['Partition', 'Size', 'Role'],
          rows: [
            ['boot', '~32 MB', 'FAT32 — tiboot3.bin + tispl.bin + u-boot.img + kernel + DTB'],
            ['rootfs-A', '~2 GB', 'Active rootfs slot'],
            ['rootfs-B', '~2 GB', 'Passive slot (OTA target)'],
            ['data', '~12 GB', '/var/lib/ambient — app state, radar frames, device certs'],
          ],
        },
      },
      {
        heading: 'Update types',
        table: {
          cols: ['Update type', 'Mechanism', 'Notes'],
          rows: [
            ['OS + kernel', 'Mender A/B rootfs swap', 'Full image write; U-Boot bootcount marks active slot'],
            ['Radar firmware', 'Mender update-module', 'Custom module pushes image to IWR6843 over SPI on boot'],
            ['App layer only', 'Mender update-module', 'Writes to /var/lib/ambient; no rootfs swap; ~30 sec update'],
          ],
        },
      },
      {
        heading: 'Rollback verification',
        commands: [{ label: 'from U-Boot prompt', code: 'printenv bootcount\nprintenv mender_boot_part\n\n# From Linux:\nmender show-artifact\nmender show-provides' }],
        warnings: [
          'The data partition must survive A/B swaps. Never store runtime state in rootfs directories — use symlinks or bind-mounts into /data.',
          'Test rollback explicitly with a deliberately broken image before production. A device that cannot roll back is a bricked device in the field.',
        ],
      },
    ],
  },
  {
    id: 'security', phase: '14', title: 'Security & Device Identity', status: 'pending', tag: 'Best Practice', time: 'reference',
    summary: 'X.509 device certs provisioned at factory. Secure boot chain locks firmware to known-good images.',
    sections: [
      {
        heading: 'Device provisioning',
        commands: [{ label: 'from host running admin-cli', code: 'ambient-admin provision \\\n  --device-id AMB-DEV-$(openssl rand -hex 3 | tr a-z A-Z) \\\n  --facility riverview \\\n  --room 312\n# Writes cert + key to device over UART at first-boot provisioning mode\n# Registers device in DynamoDB devices table' }],
        body: 'Each device gets a unique X.509 certificate provisioned at manufacture. The cert identifies the device to AWS IoT Core (mTLS), Mender, and the Nurse API. The private key never leaves the device.',
      },
      {
        heading: 'TI secure boot (HS-FS → HS-SE)',
        checklist: [
          'Generate RSA-4096 signing key pair — store private key in HSM, never in the repo',
          'Sign tiboot3.bin using TI SDK signing tools before writing to device',
          'Test signed boot on HS-FS first (signing errors are non-fatal on FS) before burning eFuses',
          'eFuse burn is one-way and irreversible — test the complete signed boot chain on 5+ devices before production run',
          'After eFuse burn, ROM rejects unsigned or incorrectly signed tiboot3.bin — no recovery without the signing key',
        ],
      },
      {
        heading: 'HIPAA-adjacent firmware requirements',
        checklist: [
          'PHI never written to firmware storage — device handles radar frames (sensor data), not patient records',
          'Cert rotation: 1-year bootstrap cert, renewal automated via Admin CLI before expiry',
          'Firmware version reported in Device Shadow — dashboard shows outdated devices',
          'Remote wipe: Mender update-module that zeroes /data and deregisters from IoT Core',
          'Audit log for all provisioning and deprovisioning events in CloudTrail',
        ],
      },
    ],
  },
  {
    id: 'ci', phase: '15', title: 'CI / Automated Builds', status: 'pending', tag: 'Best Practice', time: '~2 hr setup',
    summary: 'GitHub Actions triggers Docker-based kernel + U-Boot builds on every push. Artifacts stored with SHA-keyed filenames.',
    sections: [
      {
        heading: 'GitHub Actions workflow',
        commands: [{ label: '.github/workflows/firmware-build.yml', code: `name: Firmware Build
on:
  push:    { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4

      - name: Build container image
        run: docker build -t ambient-fw-builder .

      - name: Build kernel + DTBs
        run: |
          docker run --rm -v \${GITHUB_WORKSPACE}:/workspace \\
            ambient-fw-builder bash -c "
              source /workspace/sdk/kernel-env.sh
              cd \${KERNEL_SRC}
              make ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- defconfig
              make ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- -j\$(nproc) Image dtbs
            "

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: firmware-\${{ github.sha }}
          path: |
            **/arch/arm64/boot/Image
            **/arch/arm64/boot/dts/ti/*.dtb` }],
        warnings: [
          'The TI SDK (14 GB) cannot be checked into the repo. Cache it in a self-hosted runner or mount from a pre-built Docker layer. Plan this before configuring CI.',
          'U-Boot build (~60–90 min) is too slow for PR checks. Run kernel-only builds on every PR; run full bootchain builds on merge to main only.',
        ],
      },
      {
        heading: 'Artifact versioning',
        commands: [{ code: '# Tag every artifact with git SHA\ncp arch/arm64/boot/Image deploy/Image-$(git rev-parse --short HEAD)\n\n# Generate checksum manifest\nsha256sum deploy/* > deploy/SHA256SUMS\n\n# Verify on device after copy\nsha256sum -c /boot/SHA256SUMS' }],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const HW_SPECS = [
  { label: 'Dev Board', value: 'SK-AM62-LP',   sub: 'AM625 · A53 × 4 @ 1.4 GHz' },
  { label: 'Prod Module', value: 'OSD62x-PM',  sub: 'AM6254 + 1 GB DDR4 · 500-ball BGA' },
  { label: 'Radar', value: 'IWR6843AOP',        sub: '60 GHz · antenna-on-package' },
  { label: 'SDK', value: '11.02.08.02',          sub: '2026 LTS · Kernel 6.12.57+git-ti' },
  { label: 'OTA', value: 'Mender',               sub: 'Hosted · A/B rootfs · update-modules' },
];

const CHECKLIST_ITEMS = [
  'Docker Ubuntu 22.04 x86_64 (QEMU, Rosetta OFF)',
  'TI Processor SDK 11.02.08.02 installed',
  'Cross-toolchain verified (aarch64-oe-linux-gcc 13.4)',
  'Kernel + DTB built (Image 22 MB, dtb 65 KB)',
  'U-Boot compiled (tiboot3.bin, tispl.bin, u-boot.img)',
  'Repo pushed to ambientintel/ambientfirmware',
  'Custom DTB build validated (k3-am62-lp-sk-ambient.dtb)',
  'IWR6843AOP prototyped on Raspberry Pi',
  'AM62 SoC locked: Octavo OSD62x-PM (ADR-0002)',
  'SK-AM62-LP hardware received',
  'First boot with prebuilt SD image',
  'First boot with custom kernel',
  'Patches directory initialized',
  'JTAG / XDS110 debug loop working',
  'TFTP/NFS dev loop set up',
  'meta-ambient Yocto layer scaffolded',
  'Mender integration in Yocto image',
  'Device provisioning tested end-to-end',
  'Secure boot tested on HS-FS device',
  'CI pipeline building on every push',
];

const CHECKLIST_DONE = new Set([0,1,2,3,4,5,6,7,8]);

const OPEN_DECISIONS = [
  'Wi-Fi module: Murata 1YN vs CYW43xx — TI SDK driver maturity check pending',
  'Radar boot mode: host-fed SPI preferred; radar island BOM schematic not yet final',
  'Fab stackup: 8-layer vs 10-layer HDI for OSD62x-PM 500-ball BGA escape routing',
  'OP-TEE trusted app scope — key storage only, or also fall-event timestamp signing?',
  'CI self-hosted runner strategy for 14 GB SDK dependency',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY        = 'ambient-fw-checklist-v2';
const LS_FREEZE_KEY = 'ambient-fw-frozen-v1';

export default function FirmwarePage() {
  const [active, setActive]             = useState('env');
  const [collapsed, setCollapsed]       = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode]       = useState(false);
  const [checked, setChecked]           = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag]       = useState('All');
  const [designFrozen, setDesignFrozen] = useState(false);
  const [frozenDate, setFrozenDate]     = useState<string | null>(null);
  const isMounted = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setDesignFrozen(true); setFrozenDate(p.date); }
    } catch { /* ignore */ }
    fetch('/api/eng/state').then(r => r.json()).then((all) => {
      const d = all['firmware'];
      if (!d) return;
      if (Array.isArray(d.checked)) { setChecked(new Set(d.checked)); try { localStorage.setItem(LS_KEY, JSON.stringify(d.checked)); } catch { /* ignore */ } }
      if (typeof d.frozen === 'string') { setDesignFrozen(true); setFrozenDate(d.frozen); try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date: d.frozen })); } catch { /* ignore */ } }
      else if (d.frozen === null) { setDesignFrozen(false); setFrozenDate(null); try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ } }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/eng/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'firmware', checked: [...checked], frozen: designFrozen ? frozenDate : null }),
      }).catch(() => {});
    }, 800);
  }, [checked, designFrozen, frozenDate]);

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  // j/k keyboard navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setActive(prev => {
      const idx = STEPS.findIndex(s => s.id === prev);
      const next = idx + dir;
      return next >= 0 && next < STEPS.length ? STEPS[next].id : prev;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'j') navigate(1);
      if (e.key === 'k') navigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  function toggleSection(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }
  function expandAll()  { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  function toggleFreeze() {
    if (!ready && !designFrozen) return;
    setDesignFrozen(f => {
      const next = !f;
      if (next) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setFrozenDate(date);
        try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date })); } catch { /* ignore */ }
      } else {
        setFrozenDate(null);
        try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ }
      }
      return next;
    });
  }

  const TAGS = ['All', 'Setup', 'Build', 'Deploy', 'Best Practice'];
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => {
    warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0);
  });

  // Section open/closed logic — in focus mode all sections are open
  function isSectionOpen(key: string) {
    return focusMode ? true : collapsed[key] !== true;
  }

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes dfFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes dfGlow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(37,99,235,0.18), 0 2px 8px rgba(37,99,235,0.10); }
        50%       { box-shadow: 0 0 0 5px rgba(37,99,235,0.28), 0 4px 24px rgba(37,99,235,0.20); }
      }
      .df-ready {
        background: linear-gradient(-45deg, #2563EB, #1D4ED8, #1E40AF, #2563EB);
        background-size: 300% 300%;
        animation: dfFlow 3s ease infinite;
        border: 1.5px solid transparent;
      }
      .df-ready .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-ready .df-sub   { color: rgba(255,255,255,0.82); }
      .df-frozen {
        background: linear-gradient(-45deg, #1D4ED8, #2563EB, #3B82F6, #60A5FA, #2563EB, #1D4ED8);
        background-size: 300% 300%;
        animation: dfFlow 4s ease infinite, dfGlow 2.5s ease-in-out infinite;
        border: 1.5px solid transparent;
      }
      .df-frozen .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-frozen .df-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/engineering" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '3px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#9CA3AF' }}>Engineering</span>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Firmware</em>
              </span>
            </div>
          </Link>

          {/* Progress bar */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PIPELINE_PHASES.map(phase => {
            const phaseSteps = phase.ids
              .map(id => STEPS.find(s => s.id === id)!)
              .filter(s => filterTag === 'All' || s.tag === filterTag);
            if (phaseSteps.length === 0) return null;
            return (
              <div key={phase.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 8px', marginBottom: 5 }}>{phase.label}</div>
                {phaseSteps.map(s => {
                  const sc = SC[s.status];
                  const isActive = active === s.id;
                  const warns = warnCounts[s.id] ?? 0;
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#EFF6FF' : 'transparent', border: isActive ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400, lineHeight: 1.3 }}>{s.title}</span>
                      {warns > 0 && (
                        <span title={`${warns} warning${warns > 1 ? 's' : ''}`} style={{ fontSize: 9, background: '#FEF9C3', color: '#A16207', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠{warns}</span>
                      )}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer — keyboard hint */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
            <a href="https://github.com/ambientintel/ambientfirm" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientfirm</a>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['j','k'] as const).map(k => (
              <kbd key={k} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: '#F9FAFB', border: '1px solid #E5E7EB', fontFamily: 'var(--mono)', fontSize: 11, color: '#6B7280', boxShadow: '0 1px 0 #D1D5DB' }}>{k}</kbd>
            ))}
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>navigate steps</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: '24px 36px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Hardware Platform</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              AM62x <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Firmware</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 500, lineHeight: 1.6 }}>
              Step-by-step build, test, and deployment process for the TI AM62x + IWR6843AOP platform.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientfirm" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientfirm
          </a>
        </div>

        {/* Pipeline strip */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
            {PIPELINE_PHASES.map((phase, pi) => (
              <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: pi === 0 ? '0 24px 0 0' : '0 24px', borderRight: '1px solid #E5E7EB' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>{phase.label}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {phase.ids.map((id, si) => {
                    const s = STEPS.find(x => x.id === id)!;
                    const sc = SC[s.status];
                    const isActive = active === id;
                    return (
                      <span key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px', alignSelf: 'center' }} />}
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #2563EB' : `1px solid ${sc.border}`, background: isActive ? '#EFF6FF' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#2563EB' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Production Release milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: designFrozen || ready ? 'linear-gradient(90deg,#E5E7EB,#2563EB)' : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={designFrozen || ready ? '#2563EB' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: designFrozen || ready ? '#2563EB' : '#9CA3AF' }}>
                  {designFrozen ? 'Saved ✓' : 'Goal'}
                </div>
                <button
                  onClick={toggleFreeze}
                  className={designFrozen ? 'df-frozen' : ready ? 'df-ready' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', borderRadius: 9,
                    cursor: ready || designFrozen ? 'pointer' : 'default',
                    ...(!(designFrozen || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                    transition: 'all 0.25s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    {designFrozen || ready ? (
                      <>
                        <path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="8" cy="8" r="2.2" fill="#2563EB" fillOpacity="0.25"/>
                      </>
                    ) : (
                      <>
                        <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="df-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: designFrozen ? '#2563EB' : ready ? '#1D4ED8' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {designFrozen ? 'Released ✓' : 'Production Release'}
                    </span>
                    <span className="df-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: designFrozen ? '#2563EB' : ready ? '#2563EB' : '#9CA3AF' }}>
                      {designFrozen ? (frozenDate ? `Locked ${frozenDate}` : 'Firmware locked') : ready ? 'Ready — click to lock' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
          {HW_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '13px 15px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 4 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Main two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 22, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const tagStyle = TAG_STYLE[step.tag] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div style={{ padding: '20px 24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Focus mode toggle */}
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: focusMode ? '#EFF6FF' : '#FFFFFF', color: focusMode ? '#2563EB' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h2M9 6h2M6 1v2M6 9v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                        {focusMode ? 'Focus ON' : 'Focus'}
                      </button>
                      {/* Expand/collapse all */}
                      <button onClick={expandAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Expand all</button>
                      <button onClick={collapseAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Collapse all</button>
                      {/* Status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sc.label}</span>
                      </div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 8px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = isSectionOpen(key);
              const hasContent = !!(sec.commands?.length || sec.artifacts?.length || sec.warnings?.length || sec.table || sec.checklist);
              const hasOnlyBody = !hasContent && !!sec.body;
              if (focusMode && hasOnlyBody) return null;

              return (
                <div key={key} style={{ marginBottom: 10, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggleSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: isOpen ? '#FAFBFC' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#2563EB' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
                      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 13, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: '16px 18px 18px' }}>
                      {!focusMode && sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.7 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ position: 'relative', background: '#1E2433', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '14px 48px 14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                            <CopyBtn code={cmd.code} />
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2563EB', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1D4ED8', marginBottom: 2 }}>{a.file}</div>
                                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '9px 13px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {!focusMode && sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#2563EB', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 9 }}>
                          <span style={{ color: '#D97706', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {stepIdx > 0
                ? <button onClick={() => setActive(STEPS[stepIdx - 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    ← <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>k</kbd> {STEPS[stepIdx - 1].title}
                  </button>
                : <div />}
              {stepIdx < STEPS.length - 1
                ? <button onClick={() => setActive(STEPS[stepIdx + 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {STEPS[stepIdx + 1].title} <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>j</kbd> →
                  </button>
                : <div />}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* Interactive checklist */}
            <div style={{ padding: '16px 16px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Build Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 11.5, color: done ? '#374151' : '#9CA3AF', lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#D1D5DB' }}>{item}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 11 }}>Open Decisions</div>
              {OPEN_DECISIONS.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#D97706', opacity: 0.7, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
