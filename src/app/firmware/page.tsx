'use client';
import { useState } from 'react';
import Link from 'next/link';

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';

interface Step {
  id: string;
  phase: string;
  title: string;
  status: StepStatus;
  summary: string;
  sections: Section[];
}

interface Section {
  heading?: string;
  body?: string;
  commands?: Command[];
  artifacts?: Artifact[];
  warnings?: string[];
  table?: { cols: string[]; rows: string[][] };
}

interface Command {
  label?: string;
  code: string;
}

interface Artifact {
  file: string;
  role: string;
  size?: string;
}

const STATUS_CONFIG: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: 'rgba(61,204,145,0.10)',  border: 'rgba(61,204,145,0.28)',  color: '#3DCC91', dot: '#3DCC91' },
  pending: { label: 'Pending',   bg: 'rgba(255,201,64,0.10)',  border: 'rgba(255,201,64,0.28)',  color: '#FFC940', dot: '#FFC940' },
  blocked: { label: 'Blocked',   bg: 'rgba(248,81,73,0.10)',   border: 'rgba(248,81,73,0.28)',   color: '#F85149', dot: '#F85149' },
  warning: { label: 'Attention', bg: 'rgba(210,153,34,0.10)',  border: 'rgba(210,153,34,0.28)',  color: '#D29922', dot: '#D29922' },
};

const STEPS: Step[] = [
  {
    id: 'env',
    phase: '01',
    title: 'Host Environment',
    status: 'done',
    summary: 'Docker Desktop + QEMU x86_64 emulation on Apple Silicon. Rosetta must be OFF.',
    sections: [
      {
        heading: 'Docker Desktop setup',
        body: 'Open Docker Desktop → Settings → General. Uncheck "Use Rosetta for x86/amd64 emulation on Apple Silicon". Rosetta has a .bss size overflow bug that silently corrupts linked binaries — U-Boot SPL was the symptom. QEMU emulation only.',
      },
      {
        heading: 'Enter the build container',
        commands: [
          { label: 'from macOS host', code: 'cd ~/ti-am62x\n./enter.sh' },
        ],
        body: 'The container is Ubuntu 22.04 x86_64. The workspace bind-mount maps ~/ti-am62x/workspace (Mac) → /workspace (container). Run all builds inside the container. Commits and pushes happen on the Mac host to preserve SSH credentials.',
      },
      {
        heading: 'Additional packages (already in Dockerfile)',
        commands: [
          {
            code: 'sudo apt install -y \\\n  swig python3-dev python3-setuptools \\\n  libgnutls28-dev uuid-dev libftdi-dev \\\n  libusb-1.0-0-dev libcap-dev libpython3-dev \\\n  pkg-config python3-yaml python3-pyelftools \\\n  python3-jsonschema python3-lxml\nsudo pip3 install yamllint',
          },
        ],
        warnings: [
          'U-Boot 2025.01 requires these packages beyond stock Ubuntu 22.04. Missing swig causes cryptic Python import errors mid-build.',
        ],
      },
    ],
  },
  {
    id: 'sdk',
    phase: '02',
    title: 'TI Processor SDK',
    status: 'done',
    summary: 'SDK v11.02.08.02 (2026 LTS). Downloaded separately — 14 GB, not committed to the repo.',
    sections: [
      {
        heading: 'SDK location',
        body: 'The SDK installer lives outside git. Place it at ~/ti-am62x/workspace/sdk/ (Mac) before entering the container. The container sees it at /workspace/sdk/.',
        commands: [
          { label: 'verify SDK root inside container', code: 'ls /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/' },
        ],
      },
      {
        heading: 'Key SDK paths',
        table: {
          cols: ['Path (relative to SDK root)', 'Contents'],
          rows: [
            ['board-support/ti-linux-kernel-6.12.57+git-ti/', 'Linux kernel source'],
            ['board-support/u-boot-*/', 'U-Boot source'],
            ['board-support/prebuilt-images/am62xx-evm/', 'TI prebuilt binaries'],
            ['linux-devkit/sysroots/x86_64-arago-linux/usr/bin/aarch64-oe-linux/', 'A53 cross-compiler (gcc 13.4)'],
            ['k3r5-devkit/', 'R5F toolchain'],
            ['kernel-env.sh', 'Safe environment helper (use this, not linux-devkit/environment-setup)'],
          ],
        },
      },
    ],
  },
  {
    id: 'buildenv',
    phase: '03',
    title: 'Build Environment',
    status: 'done',
    summary: 'Source kernel-env.sh — never linux-devkit/environment-setup for kernel or U-Boot builds.',
    sections: [
      {
        heading: 'Environment setup',
        commands: [
          { label: 'inside container, every session', code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh' },
          { label: 'set kernel source path', code: 'export KERNEL_SRC=/workspace/sdk/ti-processor-sdk-linux-am62xx-evm/board-support/ti-linux-kernel-6.12.57+git-ti' },
        ],
        warnings: [
          'linux-devkit/environment-setup sets CC, CFLAGS, and CPATH to aarch64 sysroot paths. This breaks HOSTCC (used for scripts/, tools/, fixdep, etc.) and causes confusing failures mid-build. kernel-env.sh sets only PATH, ARCH, and CROSS_COMPILE — nothing else.',
          'Open separate shells for kernel builds vs userspace builds. Never mix environments in the same shell.',
        ],
      },
      {
        heading: 'Verify toolchain',
        commands: [
          { code: 'aarch64-oe-linux-gcc --version\n# expect: aarch64-oe-linux-gcc (GCC) 13.4.0' },
        ],
      },
    ],
  },
  {
    id: 'uboot',
    phase: '04',
    title: 'Bootloader (U-Boot)',
    status: 'done',
    summary: 'Builds tiboot3.bin (R5 SPL), tispl.bin (A53 SPL + ATF + OP-TEE), and u-boot.img.',
    sections: [
      {
        heading: 'Build',
        commands: [
          {
            label: 'from SDK root, ~60–90 min under QEMU',
            code: 'cd /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/\nmake MAKE_JOBS=$(nproc) u-boot',
          },
        ],
        warnings: [
          'The SDK Makefile defaults to MAKE_JOBS=1. Under QEMU this makes an already slow build ~8× slower. Always override.',
        ],
      },
      {
        heading: 'Artifacts',
        artifacts: [
          { file: 'board-support/u-boot-build/r5/tiboot3.bin', role: 'R5 SPL + signed TIFS firmware. ROM loads this from SD sector offset.', size: '~400 KB' },
          { file: 'board-support/u-boot-build/a53/tispl.bin',  role: 'FIT image: A53 SPL + ATF (BL31) + OP-TEE (BL32) + DM firmware.', size: '~1.5 MB' },
          { file: 'board-support/u-boot-build/a53/u-boot.img', role: 'U-Boot proper, loaded by A53 SPL.', size: '~1 MB' },
        ],
      },
      {
        heading: 'Verify',
        commands: [
          {
            code: 'file board-support/u-boot-build/r5/tiboot3.bin  # → data\nfile board-support/u-boot-build/a53/tispl.bin   # → FIT image\nfile board-support/u-boot-build/a53/u-boot.img  # → u-boot legacy image',
          },
        ],
      },
    ],
  },
  {
    id: 'kernel',
    phase: '05',
    title: 'Linux Kernel + DTBs',
    status: 'done',
    summary: 'Kernel 6.12.57+git-ti. Build produces Image (~22 MB) and k3-am62-lp-sk.dtb (~65 KB).',
    sections: [
      {
        heading: 'Configure and build',
        commands: [
          {
            label: '~45–60 min under QEMU',
            code: 'cd $KERNEL_SRC\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- defconfig\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- ti_arm64_prune.config\nmake ARCH=arm64 CROSS_COMPILE=aarch64-oe-linux- -j$(nproc) Image dtbs',
          },
        ],
      },
      {
        heading: 'Artifacts',
        artifacts: [
          { file: 'arch/arm64/boot/Image', role: 'Uncompressed kernel image.', size: '~22 MB' },
          { file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk.dtb', role: 'Device tree blob for SK-AM62-LP.', size: '~65 KB' },
        ],
        warnings: [
          'TI naming convention: k3-am62-lp-sk (SoC family + LP variant + board). k3-am625-sk-lp does not exist in the kernel tree and will fail silently at #include.',
        ],
      },
    ],
  },
  {
    id: 'dtb',
    phase: '06',
    title: 'Custom Device Tree',
    status: 'done',
    summary: 'Ambient overlay DTS at workspace/device-tree/. Idempotent build via custom Makefile.',
    sections: [
      {
        heading: 'Overview',
        body: 'workspace/device-tree/k3-am62-lp-sk-ambient.dts #includes the stock k3-am62-lp-sk.dts and overrides model and compatible. Ambient-specific peripherals go here as new content lands.',
      },
      {
        heading: 'Build flow',
        commands: [
          {
            label: 'from inside container',
            code: 'source /workspace/sdk/ti-processor-sdk-linux-am62xx-evm/kernel-env.sh\nexport KERNEL_SRC=/workspace/sdk/ti-processor-sdk-linux-am62xx-evm/board-support/ti-linux-kernel-6.12.57+git-ti\ncd /workspace/device-tree\nmake build KERNEL_SRC=$KERNEL_SRC',
          },
        ],
        body: 'The Makefile copies the DTS into the kernel DTS directory, registers it in the kernel DT Makefile via exact-line awk insertion, then invokes make dtbs. Idempotent — safe to re-run.',
        artifacts: [
          { file: 'arch/arm64/boot/dts/ti/k3-am62-lp-sk-ambient.dtb', role: 'Ambient overlay DTB. Select via fdtfile env var or extlinux.conf once ready to switch.', size: '~65 KB' },
        ],
        warnings: [
          'Use exact-line matching (awk or grep -Fxq) for DT Makefile insertion — a substring sed match will insert duplicates on every run.',
          'Stock k3-am62-lp-sk.dtb remains the boot default. Ambient DTB is opt-in via fdtfile.',
          'Production board (OSD62x-PM) needs the Octavo DDR device-tree config, not SK-AM62-LP DDR settings. Separate DTB artifact — do not conflate.',
        ],
      },
    ],
  },
  {
    id: 'sdcard',
    phase: '07',
    title: 'SD Card Preparation',
    status: 'pending',
    summary: 'MBR + FAT32 boot (256 MB) + ext4 rootfs. Hardware on order.',
    sections: [
      {
        heading: 'Identify the card',
        commands: [
          { label: 'macOS — VERIFY the size matches your card', code: 'diskutil list\n# Write to the wrong disk → data loss. Double-check every time.' },
        ],
      },
      {
        heading: 'Partition and format',
        commands: [
          {
            label: 'macOS — zero first 16 MB, then partition',
            code: 'diskutil unmountDisk /dev/diskN\nsudo dd if=/dev/zero of=/dev/rdiskN bs=1m count=16 conv=fsync\n# Create p1: FAT32 256 MB bootable, p2: Linux remainder\nsudo newfs_msdos -F 32 -v BOOT /dev/rdiskNs1',
          },
          {
            label: 'inside container — format rootfs partition',
            code: 'sudo mkfs.ext4 -L rootfs /dev/sdXN2',
          },
        ],
      },
      {
        heading: 'Copy boot artifacts',
        commands: [
          {
            label: 'macOS — after FAT32 mounts as /Volumes/BOOT',
            code: 'cp deploy/tiboot3.bin        /Volumes/BOOT/\ncp deploy/tispl.bin         /Volumes/BOOT/\ncp deploy/u-boot.img        /Volumes/BOOT/\ncp deploy/Image             /Volumes/BOOT/\ncp deploy/k3-am625-sk-lp.dtb /Volumes/BOOT/\nsync\ndiskutil unmountDisk /dev/diskN',
          },
        ],
        warnings: [
          'Filenames are exact. ROM looks for tiboot3.bin. A53 SPL looks for tispl.bin and u-boot.img. Case matters on some tools.',
          'Always sync before unmounting. Power-off without sync is the #1 cause of mysterious card corruption.',
        ],
      },
      {
        heading: 'Populate rootfs',
        commands: [
          {
            label: 'inside container, card mounted at /mnt/sdcard-rootfs',
            code: 'sudo tar -xpf deploy/tisdk-default-image-am62xx-evm.tar.xz -C /mnt/sdcard-rootfs\nsudo sync\nsudo umount /mnt/sdcard-rootfs',
          },
        ],
      },
    ],
  },
  {
    id: 'boot',
    phase: '08',
    title: 'First Boot',
    status: 'pending',
    summary: 'Hardware on order. Serial console at 115200 8N1. Boot chain: ROM → tiboot3 → tispl → u-boot → kernel → rootfs.',
    sections: [
      {
        heading: 'Hardware setup',
        body: 'Set SW1 to SD boot — verify the exact bit pattern against the board QSG, not from memory. Insert SD card. Connect USB-C to XDS110 debug port for UART console. Connect power last.',
      },
      {
        heading: 'Open serial console',
        commands: [
          {
            label: 'macOS — two tty.usbmodem* devices appear; use the higher-numbered one',
            code: 'ls /dev/tty.usb*\ntio /dev/tty.usbmodemXXXXXX3 -b 115200',
          },
        ],
        body: '115200 8N1, no flow control. tio is preferred — it handles reconnects automatically.',
      },
      {
        heading: 'Expected boot chain',
        table: {
          cols: ['Stage', 'Who runs', 'Expected output', 'Failure signal'],
          rows: [
            ['1', 'ROM → tiboot3.bin (R5 SPL)', '"U-Boot SPL … Trying to boot from MMC2"', 'Silence → wrong boot mode or SD unreadable'],
            ['2', 'tiboot3 loads tispl.bin', '"Loading fit image from MMC"', 'Hang → DDR training fail or tispl.bin missing'],
            ['3', 'A53 SPL → U-Boot', '"U-Boot … CPU: AM62X SR1.0 HS-FS … Hit any key"', 'Hang → u-boot.img missing or ATF/OP-TEE crash'],
            ['4', 'U-Boot autoboots kernel', '"Starting kernel … Booting Linux on … CPU 0x0"', '"Bad Linux ARM64 Image magic!" → DTB/kernel swap'],
            ['5', 'Rootfs + systemd', '"am62xx-evm login:"', 'Panic: VFS → check root= bootarg, mmcblk0 vs 1'],
          ],
        },
      },
      {
        heading: 'Success criteria',
        body: 'Login prompt on UART0. uname -a shows built kernel. cat /proc/device-tree/model returns SK-AM62-LP string. dmesg | grep -i error clean. ls /sys/class/net shows lo + eth0.',
        commands: [
          { label: 'capture full boot log for the record', code: 'tio /dev/tty.usbmodemXXXXXX3 -b 115200 -l -L first-boot.log' },
          { label: 'after boot — verify', code: 'uname -a\ncat /proc/device-tree/model\nls /sys/class/net' },
        ],
        warnings: [
          'mmcblk1 vs mmcblk0: eMMC enumerates before SD. On SK boards with no eMMC, SD may be mmcblk0. Check with "mmc list" from U-Boot shell if kernel panics on rootfs mount.',
          'Linux console is ttyS2 for AM62x (MAIN_UART0). Bootargs must say console=ttyS2,115200n8.',
        ],
      },
      {
        heading: 'After first successful boot',
        body: 'Commit first-boot.log. Record dmesg timestamps as boot-time baseline. Snapshot the SD card: sudo dd if=/dev/diskN of=golden-sd.img bs=1m then compress. This is your recovery image.',
      },
    ],
  },
  {
    id: 'devloop',
    phase: '09',
    title: 'TFTP / NFS Dev Loop',
    status: 'pending',
    summary: 'Fast iteration: U-Boot loads kernel + DTB from Mac over TFTP; rootfs mounted over NFS. No SD re-burn per change.',
    sections: [
      {
        heading: 'Why',
        body: 'Re-burning an SD card for each kernel change is 5–10 minutes of friction. TFTP boot + NFS rootfs cuts the iteration cycle to under 60 seconds. Set this up immediately after first boot.',
      },
      {
        heading: 'Mac host setup',
        commands: [
          { label: 'install TFTP server (macOS built-in)', code: 'sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist\n# TFTP root: /private/tftpboot/' },
          { label: 'install NFS server', code: 'brew install nfs-utils\n# or use macOS built-in: /etc/exports' },
        ],
      },
      {
        heading: 'U-Boot environment',
        commands: [
          {
            label: 'set once at U-Boot prompt',
            code: 'setenv serverip 192.168.1.100   # Mac IP\nsetenv ipaddr   192.168.1.101   # board IP\nsetenv bootargs console=ttyS2,115200n8 root=/dev/nfs nfsroot=192.168.1.100:/path/to/rootfs rw\nsetenv bootcmd \'tftpboot 0x82000000 Image; tftpboot 0x88000000 k3-am62-lp-sk.dtb; booti 0x82000000 - 0x88000000\'\nsaveenv',
          },
        ],
      },
    ],
  },
  {
    id: 'radar',
    phase: '10',
    title: 'Radar Integration',
    status: 'pending',
    summary: 'IWR6843AOP 60 GHz mmWave. Interface: UART (primary) + SPI (future). Boot mode decision open.',
    sections: [
      {
        heading: 'Interface boundary (AM62 ↔ IWR6843AOP)',
        table: {
          cols: ['Signal', 'Type', 'Notes'],
          rows: [
            ['UART TX/RX', 'Primary data + command', '~921.6 kbaud. Short isolated runs across ground stitch.'],
            ['SPI + SPI_HOST_INTR', 'Future bandwidth expansion', 'Wired, not yet used.'],
            ['NRESET', 'Control', 'AM62 holds radar in reset until ready.'],
            ['SOP[2:0]', 'Boot mode strapping', 'Determines radar firmware boot source.'],
            ['NERROR_OUT', 'Fault signal', 'Radar asserts on fatal error.'],
          ],
        },
      },
      {
        heading: 'Open: radar boot mode',
        body: 'Two options, decision pending before schematic capture completes on radar island.',
        warnings: [
          'Autonomous QSPI (TI default): radar boots from its own flash. Two OTA targets to manage. BOM includes QSPI flash.',
          'Host-fed from AM62 over SPI: radar omits QSPI flash, AM62 pushes firmware image on NRESET release. Single OTA source of truth. Radar cannot start until AM62 has booted far enough to feed it.',
          'Lean toward host-fed for production. Lock this before radar island schematic capture is finalized.',
        ],
      },
      {
        heading: 'Voltage domain check',
        body: 'AM62 IO (via OSD62x-PM) and IWR6843 IO domain compatibility must be confirmed during schematic capture. If domains are mismatched, level-shifters are required on all interface nets.',
      },
    ],
  },
];

const HARDWARE_SPECS = [
  { label: 'Dev Board', value: 'TI SK-AM62-LP', sub: 'AM625, Cortex-A53 × 4 @ 1.4 GHz' },
  { label: 'Prod SoC', value: 'Octavo OSD62x-PM', sub: 'AM6254 + 1 GB DDR4, 500-ball BGA' },
  { label: 'Radar', value: 'IWR6843AOP', sub: '60 GHz mmWave, antenna-on-package' },
  { label: 'SDK', value: '11.02.08.02', sub: '2026 LTS, Kernel 6.12.57+git-ti' },
  { label: 'Container', value: 'Ubuntu 22.04', sub: 'x86_64 under QEMU (Rosetta OFF)' },
];

const STATUS_CHECKLIST = [
  { done: true,  text: 'Docker Ubuntu 22.04 x86_64 container (QEMU, Rosetta OFF)' },
  { done: true,  text: 'TI Processor SDK 11.02.08.02 installed' },
  { done: true,  text: 'Cross-toolchain verified (aarch64-oe-linux-gcc 13.4)' },
  { done: true,  text: 'Kernel + DTB build succeeded (Image 22 MB, dtb 65 KB)' },
  { done: true,  text: 'U-Boot compiled (tiboot3.bin, tispl.bin, u-boot.img)' },
  { done: true,  text: 'Git repo pushed to ambientintel/ambientfirmware' },
  { done: true,  text: 'Custom DTB build validated (k3-am62-lp-sk-ambient.dtb)' },
  { done: true,  text: 'IWR6843AOP prototyped on Raspberry Pi via Mistral module' },
  { done: true,  text: 'AM62 island SoC locked: Octavo OSD62x-PM (ADR-0002)' },
  { done: false, text: 'SK-AM62-LP hardware received (on order)' },
  { done: false, text: 'First boot with prebuilt SD card image' },
  { done: false, text: 'First boot with custom kernel' },
  { done: false, text: 'TFTP/NFS dev loop set up' },
  { done: false, text: 'Radar boot mode decision locked' },
  { done: false, text: 'Pin mux spreadsheet against OSD62x-PM ball map' },
];

const NAV_STEPS = STEPS.map(s => ({ id: s.id, phase: s.phase, title: s.title, status: s.status }));

export default function FirmwarePage() {
  const [activeStep, setActiveStep] = useState<string>('env');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const currentStep = STEPS.find(s => s.id === activeStep)!;
  const doneCount = STATUS_CHECKLIST.filter(c => c.done).length;

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="app" style={{ background: '#0C0D0F', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{ background: '#0C0D0F', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="brand" style={{ marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(45,114,210,0.18)', border: '1px solid rgba(45,114,210,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="4" width="10" height="1.5" rx="0.75" fill="#2D72D2"/>
                  <rect x="2" y="7" width="7" height="1.5" rx="0.75" fill="#2D72D2" opacity="0.7"/>
                  <rect x="2" y="10" width="5" height="1.5" rx="0.75" fill="#2D72D2" opacity="0.4"/>
                </svg>
              </div>
              <div className="brand-name">Ambient <em>Firmware</em></div>
            </div>
          </Link>

          {/* Progress pill */}
          <div style={{ padding: '10px 8px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(246,247,248,0.35)' }}>Build Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#3DCC91' }}>{doneCount}/{STATUS_CHECKLIST.length}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#3DCC91', width: `${(doneCount / STATUS_CHECKLIST.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav-section">
          <div className="nav-label">Steps</div>
          {NAV_STEPS.map(step => {
            const sc = STATUS_CONFIG[step.status];
            return (
              <button
                key={step.id}
                className={`nav-item${activeStep === step.id ? ' active' : ''}`}
                onClick={() => setActiveStep(step.id)}
                style={{ textAlign: 'left' }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: activeStep === step.id ? '#2D72D2' : 'rgba(246,247,248,0.28)', minWidth: 18, letterSpacing: '0.04em' }}>{step.phase}</span>
                <span style={{ flex: 1 }}>{step.title}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0, opacity: 0.85 }} />
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="status-dot" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.04em' }}>ambientintel/ambientfirm</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main" style={{ background: '#0C0D0F' }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="crumb">Ambient Intelligence · Hardware Platform</div>
            <h1 className="page-title">AM62x <em>Firmware</em></h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(246,247,248,0.5)', fontSize: 14, maxWidth: 540 }}>
              Step-by-step build, test, and boot process for the TI AM62x + IWR6843AOP fall-detection platform.
            </p>
          </div>
          <a
            href="https://github.com/ambientintel/ambientfirm"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.04em', textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" opacity="0.7">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            ambientintel/ambientfirm
          </a>
        </div>

        {/* Hardware spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, margin: '32px 0' }}>
          {HARDWARE_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(246,247,248,0.35)', marginBottom: 6 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(246,247,248,0.42)', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column: step detail + status checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 28, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = STATUS_CONFIG[currentStep.status];
              return (
                <div style={{ padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${sc.border}`, borderRadius: 14, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2D72D2', letterSpacing: '0.1em', background: 'rgba(45,114,210,0.12)', border: '1px solid rgba(45,114,210,0.25)', borderRadius: 4, padding: '3px 10px' }}>
                        STEP {currentStep.phase}
                      </div>
                      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28, margin: 0, letterSpacing: '-0.01em' }}>{currentStep.title}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: sc.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sc.label}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(246,247,248,0.6)', fontSize: 13.5, lineHeight: 1.55 }}>{currentStep.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {currentStep.sections.map((section, si) => {
              const key = `${currentStep.id}-${si}`;
              const isExpanded = expandedSections[key] !== false;
              return (
                <div key={key} style={{ marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                  {section.heading && (
                    <button
                      onClick={() => toggleSection(key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.018)', cursor: 'pointer', border: 0 }}
                    >
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'rgba(246,247,248,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{section.heading}</span>
                      <span style={{ color: 'rgba(246,247,248,0.3)', fontSize: 16, transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▾</span>
                    </button>
                  )}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 18px' }}>
                      {section.body && (
                        <p style={{ margin: section.heading ? '14px 0 12px' : '18px 0 12px', color: 'rgba(246,247,248,0.6)', fontSize: 13.5, lineHeight: 1.6 }}>{section.body}</p>
                      )}

                      {section.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(246,247,248,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}># {cmd.label}</div>
                          )}
                          <div style={{ background: '#0A0B0D', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#A8B5C4', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                          </div>
                        </div>
                      ))}

                      {section.artifacts && section.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(246,247,248,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Artifacts</div>
                          {section.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 14px', background: 'rgba(45,114,210,0.06)', border: '1px solid rgba(45,114,210,0.15)', borderRadius: 8, marginBottom: 8 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#2D72D2', flex: '0 0 auto', marginTop: 1 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#6EAAFF', marginBottom: 3 }}>{a.file}</div>
                                <div style={{ fontSize: 12.5, color: 'rgba(246,247,248,0.5)', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && (
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(246,247,248,0.3)', flexShrink: 0 }}>{a.size}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {section.table && (
                        <div style={{ marginTop: 14, overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                            <thead>
                              <tr>
                                {section.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(246,247,248,0.35)', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '10px 12px', color: ci === 0 ? '#A8B5C4' : 'rgba(246,247,248,0.55)', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 12.5, lineHeight: 1.5, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {section.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(255,201,64,0.06)', border: '1px solid rgba(255,201,64,0.20)', borderRadius: 8, marginTop: 10 }}>
                          <span style={{ color: '#FFC940', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(246,247,248,0.6)', lineHeight: 1.55 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Step nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {(() => {
                const idx = STEPS.findIndex(s => s.id === activeStep);
                const prev = idx > 0 ? STEPS[idx - 1] : null;
                const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
                return (
                  <>
                    {prev ? (
                      <button onClick={() => setActiveStep(prev.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(246,247,248,0.6)', fontSize: 13, cursor: 'pointer', background: 'transparent', transition: 'all 0.15s' }}>
                        ← <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', color: 'rgba(246,247,248,0.35)' }}>{prev.phase}</span> {prev.title}
                      </button>
                    ) : <div />}
                    {next ? (
                      <button onClick={() => setActiveStep(next.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(246,247,248,0.6)', fontSize: 13, cursor: 'pointer', background: 'transparent', transition: 'all 0.15s' }}>
                        {next.title} <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', color: 'rgba(246,247,248,0.35)' }}>{next.phase}</span> →
                      </button>
                    ) : <div />}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Status checklist */}
          <div style={{ position: 'sticky', top: 28 }}>
            <div style={{ padding: '20px 20px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(246,247,248,0.35)', marginBottom: 14 }}>Build Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STATUS_CHECKLIST.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: item.done ? 'none' : '1.5px solid rgba(255,255,255,0.18)', background: item.done ? '#3DCC91' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0C0D0F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: item.done ? 'rgba(246,247,248,0.7)' : 'rgba(246,247,248,0.38)', lineHeight: 1.45 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(246,247,248,0.35)' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#3DCC91' }}>{Math.round((doneCount / STATUS_CHECKLIST.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #3DCC91, #2D72D2)', width: `${(doneCount / STATUS_CHECKLIST.length) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ marginTop: 16, padding: '18px 20px', background: 'rgba(255,201,64,0.05)', border: '1px solid rgba(255,201,64,0.18)', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FFC940', marginBottom: 12 }}>Open Decisions</div>
              {[
                { n: '1', text: 'Radar boot mode — QSPI autonomous vs host-fed from AM62' },
                { n: '2', text: 'Connectivity — wired / Wi-Fi / BLE / cellular mix' },
                { n: '3', text: 'App runtime — native binary / Python / containers' },
                { n: '4', text: 'OTA strategy — A/B partitions / delta / full image' },
                { n: '5', text: 'Rootfs — Buildroot / trimmed Yocto / tisdk default' },
              ].map(d => (
                <div key={d.n} style={{ display: 'flex', gap: 10, marginBottom: 9 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#FFC940', opacity: 0.6, flexShrink: 0, marginTop: 2 }}>{d.n}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(246,247,248,0.5)', lineHeight: 1.45 }}>{d.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
