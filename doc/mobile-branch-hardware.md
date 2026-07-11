# Branch mobile — BLE hardware

The branch app (`apps/mobile-branch`) supports optional Bluetooth peripherals for weighing and label printing.

## Thermal printers

- **Discovery**: `lib/labels.ts` scans for 8 seconds and matches device names containing `printer`, `pos`, `mtp`, `rpp`, or `thermal`.
- **Selection**: If multiple printers are found, the user picks one from an alert dialog. The chosen device id is remembered in AsyncStorage for subsequent prints.
- **ESC/POS**: Labels are sent as raw bytes via `lib/ble-devices.ts` → `writeEscPosToDevice`. QR codes use native ESC/POS QR commands (Model 2), not plain text.
- **Pairing**: Pair the printer in OS Bluetooth settings before opening the app. The app does not initiate OS-level pairing.

### Supported printers

Any BLE thermal printer that exposes a writable characteristic accepting ESC/POS byte streams. Common 58 mm / 80 mm models (MTP-II, RPP, generic POS-5802) have been tested in development with name-heuristic matching only — verify with your hardware before production rollout.

## Weight scales

- **Service**: Bluetooth SIG Weight Scale (`0x181D`), characteristic `0x2A9D`.
- **Scan**: `hooks/use-ble-scale.ts` scans until a device with the weight service is found (no fixed timeout; user stops scan manually).
- **Parsing**: `lib/escpos.ts` → `parseWeightMeasurement` (binary) and `parseScaleText` (ASCII fallback).

## Permissions

Android requires `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and `ACCESS_FINE_LOCATION` at runtime. iOS requires the Bluetooth usage strings in `app.config.ts`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No printer found | Printer powered on, paired in OS settings, name matches heuristic |
| QR prints as text | Update to latest app build (bitmap QR via ESC/POS) |
| Scale never connects | Scale advertises `0x181D`; try closer range |
| Write fails | Printer buffer full; power-cycle printer |
