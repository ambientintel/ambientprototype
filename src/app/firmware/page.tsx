'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Lissajous canvas background ────────────────────────────────────────────────

function LissajousCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const el = canvas;
    const ctx = el.getContext('2d')!;
    let raf: number;
    let t = 0;

    const figures = [
      { a: 1, b: 2, cx: 0.15, cy: 0.28, r: 140, phase: 0.0 },
      { a: 3, b: 2, cx: 0.50, cy: 0.10, r: 160, phase: 0.4 },
      { a: 5, b: 4, cx: 0.82, cy: 0.30, r: 120, phase: 0.9 },
      { a: 3, b: 4, cx: 0.20, cy: 0.72, r: 110, phase: 1.3 },
      { a: 5, b: 3, cx: 0.65, cy: 0.65, r: 150, phase: 0.7 },
      { a: 2, b: 3, cx: 0.88, cy: 0.78, r: 100, phase: 0.2 },
      { a: 4, b: 3, cx: 0.44, cy: 0.88, r: 130, phase: 1.8 },
    ];

    function resize() {
      el.width = el.offsetWidth;
      el.height = el.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, el.width, el.height);
      t += 0.003;

      figures.forEach(fig => {
        const cx = fig.cx * el.width;
        const cy = fig.cy * el.height;
        const delta = fig.phase + t * 0.18;
        const pts = 420;

        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const u = (i / pts) * Math.PI * 2;
          const x = cx + fig.r * Math.sin(fig.a * u + delta);
          const y = cy + fig.r * Math.sin(fig.b * u);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(37,99,235,0.055)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

// ── Status config ─────────────────────────────────────────────────────────────

const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  pending: { label: 'Pending',   bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',   bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'env', phase: '01', title: 'Host Environment', status: 'done', tag: 'Setup',
    summary: 'Docker Desktop + QEMU x86_64 on Apple Silicon. Rosetta must be disabled.',
    sections: [
      {
        heading: 'Docker Desktop',
        body: 'Open Docker Desktop → Settings → General. Uncheck "Use Rosetta for x86/amd64 emulation on Apple Silicon." Rosetta has a .bss section size overflow bug that silently corrupts linked binaries — U-Boot SPL was the symptom. Use QEMU emulation only.',
      },
      {
        heading: 'Enter the build container',
        commands: [{ label: 'from macOS host', code: 'cd ~/ti-am62x\n./enter.sh' }],
        body: 'Ubuntu 22.04 x86_64. Workspace bind-mount: ~/ti-am62x/workspace (Mac) ↔ /workspace (container). Run all builds inside the container. Commits and pushes happen on the Mac host to preserve SSH credentials.',
      },
      {
        heading: 'Required apt + pip packages',
        commands: [{
          code: 'sudo apt install -y \\\n  swig python3-dev python3-setuptools \\\n  libgnutls28-dev uuid-dev libftdi-dev \\\n  libusb-1.0-0-dev libcap-dev libpython3-dev \\\n  pkg-config python3-yaml python3-pyelftools \\\n  python3-jsonschema python3-lxml\nsudo pip3 install yamllint',
        }],
        warnings: ['U-Boot 2025.01 needs these beyond stock Ubuntu 22.04. Missing swig causes cryptic Python import errors mid-build.'],
      },
    ],
  },
  {
    id: 'sdk', phase: '02', title: 'TI Processor SDK', status: 'done', tag: 'Setup',
    summary: 'SDK v11.02.08.02 (2026 LTS). Downloaded separately (14 GB) — not in the repo.',
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
            ['linux-devkit/sysroots/.../aarch64-oe-linux/', 'A53 cross-compiler (gcc 13.4)'],
            ['k3r5-devkit/', 'R5F toolchain'],
            ['kernel-env.sh', 'Safe env helper — use this, not linux-devkit/environment-setup'],
          ],
        },
      },
    ],
  },
  {
    id: 'buildenv', phase: '03', title: 'Build Environment', status: 'done', tag: 'Setup',
    summary: 'Source kernel-env.sh for kernel/U-Boot — never linux-devkit/environment-setup.',
    sections: [
      {
        heading: 'Environment setup',
        commands: [
          { label: 'every session inside container', code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh\nexport KERNEL_SRC=/workspace/sdk/ti-processor-sdk-linux-am62xx-evm/board-support/ti-linux-kernel-6.12.57+git-ti' },
          { label: 'verify toolchain', code: 'aarch64-oe-linux-gcc --version\n# → aarch64-oe-linux-gcc (GCC) 13.4.0' },
        ],
        warnings: [
          'linux-devkit/environment-setup sets CC, CFLAGS, and CPATH to the aarch64 sysroot. This breaks HOSTCC (used by kernel scripts/, fixdep, etc.) and produces confusing failures mid-build.',
          'Use linux-devkit/environment-setup only for userspace application builds. Open a separate shell — never mix the two environments in one session.',
        ],
      },
    ],
  },
  {
    id: 'uboot', phase: '04', title: 'Bootloader (U-Boot)', status: 'done', tag: 'Build',
    summary: 'Builds tiboot3.bin (R5 SPL), tispl.bin (A53 SPL + ATF + OP-TEE), and u-boot.img.',
    sections: [
      {
        heading: 'Build',
        commands: [{ label: 'from SDK root — ~60–90 min under QEMU', code: 'cd /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/\nmake MAKE_JOBS=$(nproc) u-boot' }],
        warnings: ['The SDK Makefile defaults to MAKE_JOBS=1. Under QEMU this makes the build ~8× slower. Always override with $(nproc).'],
      },
      {
        heading: 'Artifacts',
        artifacts: [
          { file: 'board-support/u-boot-build/r5/tiboot3.bin', role: 'R5 SPL + signed TIFS firmware. ROM loads this from SD sector offset.', size: '~400 KB' },
          { file: 'board-support/u-boot-build/a53/tispl.bin', role: 'FIT image: A53 SPL + ATF (BL31) + OP-TEE (BL32) + DM firmware.', size: '~1.5 MB' },
          { file: 'board-support/u-boot-build/a53/u-boot.img', role: 'U-Boot proper, loaded by A53 SPL.', size: '~1 MB' },
        ],
      },
      {
        heading: 'Verify',
        commands: [{ code: 'file board-support/u-boot-build/r5/tiboot3.bin  # → data\nfile board-support/u-boot-build/a53/tispl.bin   # → FIT image\nfile board-support/u-boot-build/a53/u-boot.img  # → u-boot legacy image' }],
      },
    ],
  },
  {
    id: 'kernel', phase: '05', title: 'Linux Kernel + DTBs', status: 'done', tag: 'Build',
    summary: 'Kernel 6.12.57+git-ti. Produces Image (~22 MB) and k3-am62-lp-sk.dtb (~65 KB).',
    sections: [
      {
        heading: 'Configure and build',
        commands: [{
          label: '~45–60 min under QEMU',
          code: 'cd $KERNEL_SRC\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- defconfig\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- ti_arm64_prune.config\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- -j$(nproc) Image dtbs',
        }],
        artifacts: [
          { file: 'arch/arm64/boot/Image', role: 'Uncompressed kernel image.', size: '~22 MB' },
          { file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk.dtb', role: 'Device tree blob for SK-AM62-LP.', size: '~65 KB' },
        ],
        warnings: ['TI naming: k3-am62-lp-sk (not k3-am625-sk-lp). The wrong name does not exist in the kernel tree and fails silently at #include.'],
      },
    ],
  },
  {
    id: 'dtb', phase: '06', title: 'Custom Device Tree', status: 'done', tag: 'Build',
    summary: 'Ambient overlay DTS at workspace/device-tree/. Idempotent Makefile build flow.',
    sections: [
      {
        heading: 'Build',
        commands: [{
          label: 'inside container',
          code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh\nexport KERNEL_SRC=<sdk-root>/board-support/ti-linux-kernel-6.12.57+git-ti\ncd /workspace/device-tree\nmake build KERNEL_SRC=$KERNEL_SRC',
        }],
        artifacts: [
          { file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk-ambient.dtb', role: 'Ambient overlay DTB. Select via fdtfile or extlinux.conf when ready to switch.', size: '~65 KB' },
        ],
        warnings: [
          'Use exact-line awk matching (not substring sed) for DT Makefile insertion — a substring match inserts duplicates on every run.',
          'Production OSD62x-PM DTB needs the Octavo DDR device-tree config (github.com/octavosystems/osd62-pm-ddr), not the SK-AM62-LP DDR settings.',
        ],
      },
    ],
  },
  {
    id: 'patches', phase: '07', title: 'Kernel Patch Management', status: 'pending', tag: 'Best Practice',
    summary: 'Never modify the TI kernel tree directly. Use patches/ and git format-patch so changes survive SDK updates.',
    sections: [
      {
        heading: 'Why this matters',
        body: 'The TI SDK ships a snapshot of their kernel fork. When you upgrade to the next SDK release, a direct edit to the TI tree is gone. Patch series survive upgrades and can be reviewed independently of vendor changes.',
      },
      {
        heading: 'Workflow',
        commands: [
          {
            label: 'create a patch from a kernel commit',
            code: 'cd $KERNEL_SRC\n# Make your change, commit it in the TI kernel git tree\ngit format-patch -1 HEAD -o /workspace/patches/\n# produces: 0001-ambient-your-change-description.patch',
          },
          {
            label: 'apply all patches after a fresh SDK install',
            code: 'cd $KERNEL_SRC\ngit am /workspace/patches/*.patch',
          },
          {
            label: 'check a patch applies cleanly (dry run)',
            code: 'git apply --check /workspace/patches/0001-ambient-*.patch',
          },
        ],
        warnings: [
          'Never commit build artifacts (*.o, .tmp_versions, arch/arm64/boot/Image) to the patches directory.',
          'After a SDK upgrade, run "git am --3way" to resolve conflicts. If a TI patch changes the same hunk as yours, resolve manually and update the patch with "git format-patch -1 HEAD".',
        ],
      },
      {
        heading: 'Patch naming convention',
        body: 'Format: NNNN-ambient-<subsystem>-<description>.patch. Example: 0001-ambient-uart-add-rs485-termination.patch. Keep NNNN sequential and update the index in workspace/patches/README when adding.',
      },
    ],
  },
  {
    id: 'jtag', phase: '08', title: 'JTAG / Hardware Debug', status: 'pending', tag: 'Best Practice',
    summary: 'XDS110 on SK-AM62-LP gives hardware breakpoints, memory inspection, and CPU register access before the OS boots.',
    sections: [
      {
        heading: 'Hardware setup',
        body: 'The SK-AM62-LP has an onboard XDS110 emulator on connector J15 (separate micro-USB from the UART debug port J17/J18). Connect both: UART for console output, JTAG for debug control. Power the board first, then connect the JTAG USB.',
      },
      {
        heading: 'Code Composer Studio (recommended for TI)',
        commands: [
          { label: 'install CCS on Mac, then launch GDB server', code: '# In CCS: Run → Debug Configurations → New "CORTEX_A or MPU" target\n# Target: AM625 SK-LP — JTAG settings: XDS110 USB\n# Or headless via OpenOCD:' },
          { label: 'openocd with TI XDS110', code: 'openocd -f interface/ti_xds110.cfg -f target/ti_am625.cfg' },
        ],
      },
      {
        heading: 'GDB connection',
        commands: [{
          label: 'connect arm gdb to OpenOCD GDB server',
          code: 'aarch64-oe-linux-gdb vmlinux\n(gdb) target extended-remote :3333\n(gdb) monitor reset halt\n(gdb) load           # flash/program if needed\n(gdb) continue',
        }],
      },
      {
        heading: 'Useful debug techniques',
        checklist: [
          'Set hardware breakpoints before kernel init to catch early panics: hbreak start_kernel',
          'Inspect device tree in memory: x/40xw 0x88000000 (typical DTB load address)',
          'Read UART status registers directly to debug silent-boot issues without console',
          'Use "monitor arm cortex_a dacrfixup on" for data abort recovery during memory probing',
          'JTAG works even when the board appears completely hung — always try JTAG before re-burning SD',
        ],
      },
      {
        heading: 'R5 core debug',
        body: 'The AM625 runs R5F cores for SPL and device management firmware. CCS can attach to both the R5 and A53 clusters simultaneously. The R5 boots first — attach here to debug tiboot3.bin failures (DDR training, TIFS handshake) before the A53 is even running.',
      },
    ],
  },
  {
    id: 'sdcard', phase: '09', title: 'SD Card Preparation', status: 'pending', tag: 'Deploy',
    summary: 'MBR + FAT32 boot (256 MB) + ext4 rootfs. Hardware on order.',
    sections: [
      {
        heading: 'Identify the card',
        commands: [{ label: 'macOS — VERIFY size matches your card before writing', code: 'diskutil list\n# /dev/diskN — confirm size. Writing to the wrong device destroys data.' }],
      },
      {
        heading: 'Partition, format, and copy',
        commands: [
          { label: 'zero, partition, and format', code: 'diskutil unmountDisk /dev/diskN\nsudo dd if=/dev/zero of=/dev/rdiskN bs=1m count=16 conv=fsync\n# Create p1: FAT32 256 MB bootable, p2: Linux remainder\nsudo newfs_msdos -F 32 -v BOOT /dev/rdiskNs1\n# Inside container:\nsudo mkfs.ext4 -L rootfs /dev/sdXN2' },
          { label: 'copy boot artifacts to FAT partition', code: 'cp deploy/tiboot3.bin        /Volumes/BOOT/\ncp deploy/tispl.bin         /Volumes/BOOT/\ncp deploy/u-boot.img        /Volumes/BOOT/\ncp deploy/Image             /Volumes/BOOT/\ncp deploy/k3-am625-sk-lp.dtb /Volumes/BOOT/\nsync && diskutil unmountDisk /dev/diskN' },
          { label: 'populate rootfs (inside container)', code: 'sudo tar -xpf deploy/tisdk-default-image-am62xx-evm.tar.xz \\\n  -C /mnt/sdcard-rootfs\nsudo sync && sudo umount /mnt/sdcard-rootfs' },
        ],
        warnings: [
          'Filenames are exact. ROM looks for tiboot3.bin. A53 SPL looks for tispl.bin and u-boot.img. Case matters on some filesystem tools.',
          'Always sync before unmounting. Power-off without sync is the leading cause of SD card corruption.',
        ],
      },
    ],
  },
  {
    id: 'boot', phase: '10', title: 'First Boot', status: 'pending', tag: 'Deploy',
    summary: 'Boot chain: ROM → tiboot3 → tispl → u-boot → kernel → rootfs. Serial console 115200 8N1.',
    sections: [
      {
        heading: 'Hardware setup',
        body: 'Set SW1 to SD boot — verify the exact bit pattern against the board QSG, not from memory. Insert SD card. Connect USB-C to XDS110 UART port (J18). Connect power last.',
        commands: [{ label: 'open serial console on macOS', code: 'ls /dev/tty.usb*\n# Two devices appear; use the higher-numbered one\ntio /dev/tty.usbmodemXXXXXX3 -b 115200\n# Settings: 115200 8N1, no flow control' }],
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
        heading: 'Success criteria and next steps',
        commands: [
          { label: 'capture full boot log', code: 'tio /dev/tty.usbmodemXXXXXX3 -b 115200 -l -L first-boot.log' },
          { label: 'verify after boot', code: 'uname -a                        # shows built kernel\ncat /proc/device-tree/model     # → SK-AM62-LP string\nls /sys/class/net               # → lo + eth0\ndmesg | grep -i error           # should be clean' },
        ],
        warnings: [
          'mmcblk1 vs mmcblk0: eMMC enumerates before SD. On SK boards without eMMC, SD is mmcblk0. Check with "mmc list" from U-Boot shell if kernel panics on rootfs mount.',
          'Linux console is ttyS2 for AM62x. Bootargs must include console=ttyS2,115200n8.',
          'Snapshot the working SD immediately: sudo dd if=/dev/diskN of=golden-sd.img bs=1m — this is your recovery image.',
        ],
      },
    ],
  },
  {
    id: 'devloop', phase: '11', title: 'TFTP / NFS Dev Loop', status: 'pending', tag: 'Best Practice',
    summary: 'Load kernel + DTB from Mac over TFTP; mount rootfs over NFS. Cuts iteration from 10 min to under 60 sec.',
    sections: [
      {
        heading: 'Mac host setup',
        commands: [
          { label: 'enable macOS built-in TFTP server', code: 'sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist\n# TFTP root: /private/tftpboot/\ncp $KERNEL_SRC/arch/arm64/boot/Image /private/tftpboot/\ncp $KERNEL_SRC/arch/arm64/boot/dts/ti/k3-am62-lp-sk.dtb /private/tftpboot/' },
          { label: 'NFS export for rootfs (add to /etc/exports)', code: '/path/to/rootfs -network 192.168.1.0 -mask 255.255.255.0 -alldirs -maproot=0' },
        ],
      },
      {
        heading: 'U-Boot environment',
        commands: [{
          label: 'set once at U-Boot prompt — survives reboots',
          code: "setenv serverip 192.168.1.100\nsetenv ipaddr   192.168.1.101\nsetenv bootargs 'console=ttyS2,115200n8 root=/dev/nfs nfsroot=192.168.1.100:/path/to/rootfs rw ip=dhcp'\nsetenv bootcmd 'tftpboot 0x82000000 Image; tftpboot 0x88000000 k3-am62-lp-sk.dtb; booti 0x82000000 - 0x88000000'\nsaveenv",
        }],
      },
    ],
  },
  {
    id: 'yocto', phase: '12', title: 'Yocto Production Image', status: 'pending', tag: 'Best Practice',
    summary: 'tisdk default for bring-up. Production uses a custom Yocto layer (meta-ambient) with Mender integration and Python 3.11 runtime.',
    sections: [
      {
        heading: 'Why Yocto for production',
        body: 'The tisdk default rootfs includes development tools, debugging headers, and test utilities that have no place in a deployed medical-adjacent device. A custom Yocto layer gives precise control over the package set, audit trail of every included binary, and reproducible builds tied to a specific commit.',
      },
      {
        heading: 'Yocto build environment',
        body: 'Full Yocto builds take 12–20+ hours under QEMU. Use a cloud Linux VM (x86_64 native, 16+ cores, 32 GB RAM) for production builds. Local QEMU container is fine for kernel/U-Boot only.',
        commands: [
          { label: 'clone TI Yocto layers', code: 'git clone https://git.ti.com/cgit/arago-project/oe-layersetup.git\ncd oe-layersetup\n./oe-layersetup.sh -f configs/arago/arago-sdk-11.02.08.02.conf' },
          { label: 'add meta-ambient layer', code: '# In bblayers.conf:\nBBLAYERS += "/workspace/meta-ambient"\n\n# meta-ambient/conf/layer.conf sets LAYERDEPENDS += "core arago-core"' },
          { label: 'build with Mender integration', code: '. oe-init-build-env\n# add INHERIT += "mender-full" to local.conf\nbitbake ambient-image' },
        ],
        warnings: [
          'Yocto full build is not attempted locally yet. First build should be on a cloud VM with network storage for the sstate-cache — cache dramatically cuts subsequent build times from 12+ hours to under 30 minutes.',
          'Set DL_DIR and SSTATE_DIR to shared NFS or S3-backed mount so the cache persists across VM instances.',
        ],
      },
      {
        heading: 'meta-ambient layer structure',
        table: {
          cols: ['Path', 'Contents'],
          rows: [
            ['recipes-core/ambient-image/', 'Top-level image recipe — package list, IMAGE_FEATURES'],
            ['recipes-ambient/ambientapp/', 'Python app recipe — installs to /var/lib/ambient'],
            ['recipes-bsp/device-tree/', 'Pulls in workspace/device-tree DTS via SRC_URI'],
            ['recipes-connectivity/wifi/', 'Murata 1YN / CYW43xx firmware and wpa_supplicant config'],
            ['conf/layer.conf', 'Layer metadata, LAYERDEPENDS'],
          ],
        },
      },
    ],
  },
  {
    id: 'ota', phase: '13', title: 'OTA Updates (Mender)', status: 'pending', tag: 'Best Practice',
    summary: 'Mender hosted with A/B rootfs partitions. Atomic, rollback-capable updates for OS/kernel, radar firmware, and app-layer.',
    sections: [
      {
        heading: 'Partition layout (16 GB eMMC)',
        table: {
          cols: ['Partition', 'Size', 'Role'],
          rows: [
            ['boot', '~32 MB', 'FAT32, tiboot3.bin + tispl.bin + u-boot.img + kernel + DTB'],
            ['rootfs-A', '~2 GB', 'Active rootfs slot'],
            ['rootfs-B', '~2 GB', 'Passive rootfs slot (target for OTA)'],
            ['data', 'Remainder (~12 GB)', '/var/lib/ambient — app state, radar frames, certs'],
          ],
        },
      },
      {
        heading: 'Mender integration in Yocto',
        commands: [{
          label: 'in local.conf / image recipe',
          code: '# local.conf\nINHERIT += "mender-full"\nMENDER_DEVICE_TYPES_COMPATIBLE = "am62-ambient"\nMENDER_ARTIFACT_NAME = "ambient-${PV}-${DATETIME}"\n\n# Mender server URL set via mender.conf at image build time\n# or provisioned per-device at factory',
        }],
      },
      {
        heading: 'Update types and strategy',
        table: {
          cols: ['Update type', 'Mechanism', 'Notes'],
          rows: [
            ['OS + kernel', 'Mender A/B rootfs swap', 'Full image write; U-Boot bootcount marks active slot'],
            ['Radar firmware', 'Mender update-module', 'Custom module pushes image to IWR6843 over SPI on next boot'],
            ['App layer only', 'Mender update-module', 'Writes to /var/lib/ambient; no rootfs swap; ~30 sec update'],
            ['Device tree only', 'Mender A/B (bundled)', 'DTB lives in boot partition, updated with kernel slot'],
          ],
        },
      },
      {
        heading: 'Rollback mechanism',
        body: 'U-Boot maintains a bootcount variable. If the new rootfs slot does not call "mender commit" within the boot window, U-Boot increments bootcount and falls back to the previous slot. Test this explicitly before shipping: write a broken image to slot B, confirm the device recovers to slot A.',
        commands: [{
          code: '# From U-Boot prompt — inspect boot state\nprintenv bootcount\nprintenv mender_boot_part\n\n# From Linux — confirm active slot\nmender show-artifact\nmender show-provides',
        }],
        warnings: [
          'The data partition (/var/lib/ambient) must survive A/B swaps. Never store runtime state in rootfs directories. Symlinks or bind-mounts from rootfs into /data are the standard pattern.',
          'Test rollback with a deliberately bad image before production. A device that cannot roll back after a failed update is a bricked device in the field.',
        ],
      },
    ],
  },
  {
    id: 'security', phase: '14', title: 'Security & Device Identity', status: 'pending', tag: 'Best Practice',
    summary: 'X.509 device certs provisioned at factory. Secure boot chain locks firmware to known-good images. HIPAA-adjacent audit requirements.',
    sections: [
      {
        heading: 'Device identity model',
        body: 'Each device gets a unique X.509 certificate provisioned at manufacture via the Admin CLI (services/admin-cli in the cloud repo). The cert identifies the device to AWS IoT Core (mTLS), Mender, and the Nurse API. The private key never leaves the device.',
        commands: [{
          label: 'provision new device (from host running admin-cli)',
          code: 'ambient-admin provision \\\n  --device-id AMB-DEV-$(openssl rand -hex 3 | tr a-z A-Z) \\\n  --facility riverview \\\n  --room 312\n# Writes cert + key to device over UART at first-boot provisioning mode\n# Registers device in DynamoDB devices table',
        }],
      },
      {
        heading: 'TI secure boot (HS-FS → HS-SE)',
        body: 'The SK-AM62-LP ships as HS-FS (High Security — Field Securable). For production, convert to HS-SE (Security Enforced) by burning customer keys into eFuses. This locks the boot chain: ROM only loads tiboot3.bin images signed with your key.',
        checklist: [
          'Generate RSA-4096 signing key pair — store private key in HSM or sealed vault, never in the repo',
          'Sign tiboot3.bin using TI SDK signing tools before writing to device',
          'Test signed boot on HS-FS first (signing is optional on FS; errors are non-fatal) before burning eFuses',
          'eFuse burn is one-way and irreversible — test the complete signed boot chain on 5+ devices before production run',
          'After eFuse burn, ROM rejects any unsigned or incorrectly signed tiboot3.bin — no SD card recovery without the signing key',
        ],
      },
      {
        heading: 'OP-TEE trusted applications',
        body: 'OP-TEE runs in TrustZone secure world (BL32). Use it for: device key storage, secure time-stamping of fall events for audit, and any crypto operations that must not be visible to a compromised Linux userspace.',
        commands: [{
          label: 'build OP-TEE TA skeleton',
          code: 'export TA_DEV_KIT_DIR=/workspace/sdk/.../optee-os/ta_dev_kit\nmake -C workspace/ta/ambient-audit-ta',
        }],
      },
      {
        heading: 'HIPAA-adjacent requirements for firmware',
        checklist: [
          'PHI never written to firmware storage — device handles radar frames (sensor data), not patient records',
          'Audit log for all device provisioning and deprovisioning events in CloudTrail',
          'Cert rotation: 1-year bootstrap cert lifespan, renewal automated via Admin CLI before expiry',
          'Firmware version reported in Device Shadow — nursing staff can see outdated devices in the dashboard',
          'Remote wipe capability: Mender update-module that zeroes /data partition and deregisters from IoT Core',
        ],
      },
    ],
  },
  {
    id: 'ci', phase: '15', title: 'CI / Automated Builds', status: 'pending', tag: 'Best Practice',
    summary: 'GitHub Actions triggers Docker-based kernel + U-Boot builds on every push. Artifacts stored with SHA-keyed filenames.',
    sections: [
      {
        heading: 'Why automated builds matter',
        body: 'A kernel patch that compiles on one machine may fail on another due to host package differences. Containerized CI catches this immediately. It also gives you a canonical artifact store — every commit that merges to main has a verifiable build.',
      },
      {
        heading: 'GitHub Actions workflow',
        commands: [{
          label: '.github/workflows/firmware-build.yml',
          code: `name: Firmware Build
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build container image
        run: docker build -t ambient-fw-builder .

      - name: Build kernel + DTBs
        run: |
          docker run --rm -v \$\{\{ github.workspace \}\}:/workspace \\
            ambient-fw-builder bash -c "
              source /workspace/sdk/kernel-env.sh
              cd /workspace/sdk/.../ti-linux-kernel-*/
              make ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- defconfig
              make ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- -j$(nproc) Image dtbs
            "

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: firmware-\${{ github.sha }}
          path: |
            **/arch/arm64/boot/Image
            **/arch/arm64/boot/dts/ti/*.dtb`,
        }],
        warnings: [
          'The TI SDK (14 GB) cannot be checked into the repo or downloaded in CI. Cache it in a self-hosted runner or mount it from a pre-built Docker layer. Plan for this before setting up CI.',
          'U-Boot build time (~60–90 min) is too long for pull-request CI. Run kernel-only builds on every PR; run full bootchain builds on merge to main only.',
        ],
      },
      {
        heading: 'Artifact versioning',
        commands: [{
          code: '# Tag every artifact with the git SHA and kernel version\ncp arch/arm64/boot/Image deploy/Image-$(git rev-parse --short HEAD)\n\n# Generate SHA-256 checksum manifest\nsha256sum deploy/* > deploy/SHA256SUMS\n\n# Verify on the device after copy\nsha256sum -c /boot/SHA256SUMS',
        }],
      },
    ],
  },
];

// ── Supporting data ────────────────────────────────────────────────────────────

const HARDWARE_SPECS = [
  { label: 'Dev Board', value: 'SK-AM62-LP', sub: 'AM625 · A53 × 4 @ 1.4 GHz' },
  { label: 'Prod Module', value: 'OSD62x-PM', sub: 'AM6254 + 1 GB DDR4 · 500-ball BGA' },
  { label: 'Radar', value: 'IWR6843AOP', sub: '60 GHz · antenna-on-package' },
  { label: 'SDK', value: '11.02.08.02', sub: '2026 LTS · Kernel 6.12.57+git-ti' },
  { label: 'OTA', value: 'Mender', sub: 'Hosted · A/B rootfs · update-modules' },
];

const CHECKLIST = [
  { done: true,  text: 'Docker Ubuntu 22.04 x86_64 (QEMU, Rosetta OFF)' },
  { done: true,  text: 'TI Processor SDK 11.02.08.02 installed' },
  { done: true,  text: 'Cross-toolchain verified (aarch64-oe-linux-gcc 13.4)' },
  { done: true,  text: 'Kernel + DTB built (Image 22 MB, dtb 65 KB)' },
  { done: true,  text: 'U-Boot compiled (tiboot3.bin, tispl.bin, u-boot.img)' },
  { done: true,  text: 'Repo pushed to ambientintel/ambientfirmware' },
  { done: true,  text: 'Custom DTB build validated (k3-am62-lp-sk-ambient.dtb)' },
  { done: true,  text: 'IWR6843AOP prototyped on Raspberry Pi' },
  { done: true,  text: 'AM62 SoC locked: Octavo OSD62x-PM (ADR-0002)' },
  { done: false, text: 'SK-AM62-LP hardware received' },
  { done: false, text: 'First boot with prebuilt SD image' },
  { done: false, text: 'First boot with custom kernel' },
  { done: false, text: 'Patches directory initialized' },
  { done: false, text: 'JTAG / XDS110 debug loop working' },
  { done: false, text: 'TFTP/NFS dev loop set up' },
  { done: false, text: 'meta-ambient Yocto layer scaffolded' },
  { done: false, text: 'Mender integration in Yocto image' },
  { done: false, text: 'Device provisioning tested end-to-end' },
  { done: false, text: 'Secure boot tested on HS-FS device' },
  { done: false, text: 'CI pipeline building on every push' },
];

const TAGS = ['All', 'Setup', 'Build', 'Deploy', 'Best Practice'];
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Setup:         { bg: '#EFF6FF', color: '#1D4ED8' },
  Build:         { bg: '#F0FDF4', color: '#15803D' },
  Deploy:        { bg: '#FFF7ED', color: '#C2410C' },
  'Best Practice': { bg: '#FAF5FF', color: '#7E22CE' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FirmwarePage() {
  const [active, setActive] = useState('env');
  const [filterTag, setFilterTag] = useState('All');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const step = STEPS.find(s => s.id === active)!;
  const visibleSteps = filterTag === 'All' ? STEPS : STEPS.filter(s => s.tag === filterTag);
  const doneCount = CHECKLIST.filter(c => c.done).length;

  function toggle(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }

  const S = {
    page: { background: '#F1F3F6', minHeight: '100vh', position: 'relative' as const },
    sidebar: { background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '24px 16px 32px', position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 0, zIndex: 10 },
    main: { padding: '28px 40px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box' as const, position: 'relative' as const, zIndex: 1 },
  };

  return (
    <div className="app" style={S.page}>
      <LissajousCanvas />

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="3" width="10" height="1.5" rx="0.75" fill="#2563EB"/>
                  <rect x="2" y="6.5" width="7" height="1.5" rx="0.75" fill="#2563EB" opacity="0.6"/>
                  <rect x="2" y="10" width="5" height="1.5" rx="0.75" fill="#2563EB" opacity="0.35"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14.5, color: '#111827', letterSpacing: '-0.01em' }}>Ambient <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Firmware</em></span>
            </div>
          </Link>

          {/* Progress */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Build Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST.length}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 6px', marginBottom: 7 }}>Filter</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 2px' }}>
              {TAGS.map(tag => (
                <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleSteps.map(s => {
            const sc = SC[s.status];
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, background: isActive ? '#F0F7FF' : 'transparent', border: isActive ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 16, letterSpacing: '0.04em' }}>{s.phase}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400 }}>{s.title}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
          <a href="https://github.com/ambientintel/ambientfirm" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientfirm</a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 8 }}>Ambient Intelligence · Hardware Platform</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              AM62x <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Firmware</em>
            </h1>
            <p style={{ margin: '10px 0 0', color: '#6B7280', fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>
              Step-by-step build, test, and deployment process for the TI AM62x + IWR6843AOP fall-detection platform. Includes embedded Linux best practices.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientfirm" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12.5, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', transition: 'border-color 0.15s' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientfirm
          </a>
        </div>

        {/* Hardware spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {HARDWARE_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '14px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 5 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 24, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const tagStyle = TAG_COLORS[step.tag] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div style={{ padding: '22px 26px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#2563EB', letterSpacing: '0.1em', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '3px 9px' }}>
                        STEP {step.phase}
                      </div>
                      <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: sc.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sc.label}</span>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 10px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.6 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = collapsed[key] !== true;
              return (
                <div key={key} style={{ marginBottom: 12, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggle(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: isOpen ? '#FAFAFA' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 14, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: sec.heading ? '16px 20px 18px' : '18px 20px' }}>
                      {sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ background: '#1E2433', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' as const }}>{cmd.code}</pre>
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 7 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2563EB', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1D4ED8', marginBottom: 3 }}>{a.file}</div>
                                <div style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '10px 14px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.5, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '9px 13px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#2563EB', fontSize: 13, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 11, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 10 }}>
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
            {(() => {
              const idx = STEPS.findIndex(s => s.id === active);
              const prev = idx > 0 ? STEPS[idx - 1] : null;
              const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  {prev
                    ? <button onClick={() => setActive(prev.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        ← <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{prev.phase}</span> {prev.title}
                      </button>
                    : <div />}
                  {next
                    ? <button onClick={() => setActive(next.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {next.title} <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{next.phase}</span> →
                      </button>
                    : <div />}
                </div>
              );
            })()}
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>
            {/* Checklist */}
            <div style={{ padding: '18px 18px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 14 }}>Build Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {CHECKLIST.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 15, height: 15, borderRadius: 3, border: item.done ? 'none' : '1.5px solid #D1D5DB', background: item.done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 12, color: item.done ? '#374151' : '#9CA3AF', lineHeight: 1.45 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#059669', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST.length) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '16px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 12 }}>Open Decisions</div>
              {[
                'Wi-Fi module: Murata 1YN vs CYW43xx — TI SDK driver maturity check pending',
                'Radar boot mode: host-fed SPI (preferred) vs autonomous QSPI — locked in session findings but radar island BOM not yet final',
                'Fab stackup: 8-layer vs 10-layer HDI for OSD62x-PM 500-ball BGA escape routing',
                'OP-TEE trusted app scope — key storage only, or also fall-event timestamp signing?',
                'CI self-hosted runner strategy for 14 GB SDK dependency',
              ].map((d, i) => (
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
  );
}
