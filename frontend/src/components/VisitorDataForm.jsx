// Formulir pendaftaran kunjungan, urutannya:
// nama tahanan -> pembesuk 1 sampai 4 (nama, NIK, hubungan, foto KTP, selfie)
// -> alamat (sekali) -> nomor WhatsApp (sekali) -> kirim.
// Pembesuk lama (NIK sudah terdaftar): foto KTP tidak diminta lagi.
import { useEffect, useState } from 'react';
import { Formik, Form, FieldArray, getIn, useFormikContext } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PhotoField from './PhotoField';
import { checkVisitorNik, isKnownVisitor } from '../services/public.service';

const MAX_VISITORS = 20;

const HUBUNGAN = [
  'Suami/Istri',
  'Orang tua',
  'Anak',
  'Saudara',
  'Keluarga lain',
  'Teman',
  'Kuasa hukum',
  'Lainnya',
];

// id dipakai sebagai key React supaya data tidak tertukar saat pembesuk dihapus.
let seq = 0;
const emptyVisitor = () => ({
  id: `v${Date.now()}-${seq++}`,
  nama: '',
  nik: '',
  hubungan: '',
  fotoKtp: null,
  fotoPembesuk: null, // selfie terbaru
  nikChecked: '', // NIK yang sudah dicek ke server
  nikStatus: '', // 'lama' | 'baru' | 'gagal'
  namaTersamar: '', // nama tersamar dari server untuk pembesuk lama
});

// Aturan yang hanya berlaku untuk pembesuk BARU. Pembesuk lama dilewati.
function ruleForNew(message, check) {
  return {
    name: message,
    message,
    test(value) {
      if (isKnownVisitor(this.parent)) return true;
      return check(String(value ?? '').trim());
    },
  };
}

const visitorSchema = Yup.object({
  nama: Yup.string()
    .test(ruleForNew('Nama wajib diisi', (v) => v !== ''))
    .test(ruleForNew('Nama minimal 3 huruf', (v) => v === '' || v.length >= 3)),
  nik: Yup.string()
    .required('NIK wajib diisi')
    .matches(/^\d{16}$/, 'NIK harus 16 digit angka')
    .test('nik-unik', 'NIK sama dengan pembesuk lain di form ini', function (value) {
      const list = this.from?.[1]?.value?.pembesuk ?? [];
      return list.filter((p) => p.nik === value).length <= 1;
    }),
  hubungan: Yup.string().required('Hubungan dengan tahanan wajib dipilih'),
  fotoKtp: Yup.mixed()
    .nullable()
    .test('ktp-wajib', 'Foto KTP wajib diambil', function (value) {
      return isKnownVisitor(this.parent) || Boolean(value);
    }),
  fotoPembesuk: Yup.mixed().nullable().required('Foto selfie wajib diambil'),
});

const schema = Yup.object({
  tahananNama: Yup.string()
    .trim()
    .min(3, 'Nama tahanan minimal 3 huruf')
    .required('Nama tahanan wajib diisi'),
  pembesuk: Yup.array()
    .of(visitorSchema)
    .min(1, 'Minimal 1 pembesuk')
    .max(MAX_VISITORS, `Maksimal ${MAX_VISITORS} pembesuk`),
  // Alamat wajib selama masih ada pembesuk baru. Kalau semuanya sudah terdaftar, boleh kosong.
  alamat: Yup.string()
    .test('alamat-wajib', 'Alamat wajib diisi', function (value) {
      const list = this.parent.pembesuk ?? [];
      if (list.every((p) => isKnownVisitor(p))) return true;
      return String(value ?? '').trim() !== '';
    })
    .test('alamat-min', 'Alamat minimal 5 karakter', (value) => {
      const text = String(value ?? '').trim();
      return text === '' || text.length >= 5;
    }),
  noHp: Yup.string()
    .required('Nomor HP wajib diisi')
    .matches(/^(\+62|62|0)8\d{8,12}$/, 'Nomor tidak valid, contoh: 081234567890'),
});

// Kolom teks yang terhubung ke Formik. Error tampil setelah kolom disentuh.
function FormTextField({ name, helperText, ...props }) {
  const { values, errors, touched, handleChange, handleBlur } = useFormikContext();
  const error = getIn(touched, name) ? getIn(errors, name) : undefined;
  return (
    <TextField
      fullWidth
      name={name}
      value={getIn(values, name) ?? ''}
      onChange={handleChange}
      onBlur={handleBlur}
      error={Boolean(error)}
      helperText={error || helperText}
      {...props}
    />
  );
}

// Satu kartu pembesuk. Dipisah supaya cek NIK per orang punya efek sendiri.
function VisitorFields({ index, visitor, canRemove, onRemove }) {
  const { setFieldValue, errors, touched } = useFormikContext();
  const prefix = `pembesuk.${index}`;
  const { nik, nikChecked, nikStatus, namaTersamar } = visitor;
  const known = isKnownVisitor(visitor);

  // Begitu NIK 16 digit, tanyakan ke server apakah pembesuk pernah terdaftar.
  useEffect(() => {
    if (nik.length !== 16 || nikChecked === nik) return undefined;

    const controller = new AbortController();
    checkVisitorNik(nik, controller.signal)
      .then(({ found, maskedName }) => {
        if (controller.signal.aborted) return;
        setFieldValue(`${prefix}.namaTersamar`, maskedName);
        setFieldValue(`${prefix}.nikStatus`, found ? 'lama' : 'baru');
        setFieldValue(`${prefix}.nikChecked`, nik);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFieldValue(`${prefix}.nikStatus`, 'gagal');
        setFieldValue(`${prefix}.nikChecked`, nik);
      });

    return () => controller.abort();
  }, [nik, nikChecked, prefix, setFieldValue]);

  let nikHelper = `${nik.length}/16 digit`;
  if (nik.length === 16) {
    if (nikChecked !== nik) nikHelper = 'Memeriksa NIK...';
    else if (nikStatus === 'gagal') nikHelper = 'Pengecekan NIK gagal. Isi data secara lengkap.';
  }

  const photoError = (field) =>
    getIn(touched, `${prefix}.${field}`) ? getIn(errors, `${prefix}.${field}`) : undefined;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Pembesuk {index + 1}</Typography>
        {canRemove && (
          <IconButton
            aria-label={`Hapus pembesuk ${index + 1}`}
            color="error"
            onClick={onRemove}
          >
            <DeleteOutlineIcon />
          </IconButton>
        )}
      </Box>

      <Stack spacing={2}>
        <FormTextField
          name={`${prefix}.nama`}
          label="Nama lengkap"
          placeholder="Sesuai KTP"
          autoComplete="off"
          helperText={known ? 'Tidak wajib untuk pembesuk yang sudah terdaftar' : undefined}
        />

        <FormTextField
          name={`${prefix}.nik`}
          label="NIK"
          placeholder="16 digit angka"
          autoComplete="off"
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 16 } }}
          helperText={nikHelper}
          onChange={(e) =>
            setFieldValue(`${prefix}.nik`, e.target.value.replace(/\D/g, '').slice(0, 16))
          }
        />

        {known && (
          <Alert severity="success">
            Pembesuk sudah terdaftar{namaTersamar ? ` atas nama ${namaTersamar}` : ''}. Foto KTP
            tidak perlu diambil lagi. Cukup ambil foto selfie terbaru.
          </Alert>
        )}

        <FormTextField select name={`${prefix}.hubungan`} label="Hubungan dengan tahanan">
          {HUBUNGAN.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </FormTextField>

        {/* Foto KTP dan selfie berdampingan. Pembesuk lama: hanya selfie. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: known ? '1fr' : '1fr 1fr',
            gap: 1.5,
          }}
        >
          {!known && (
            <PhotoField
              label="Foto KTP"
              capture="environment"
              value={visitor.fotoKtp}
              error={photoError('fotoKtp')}
              onChange={(blob) => setFieldValue(`${prefix}.fotoKtp`, blob)}
            />
          )}
          <PhotoField
            label="Foto selfie terbaru"
            capture="user"
            value={visitor.fotoPembesuk}
            error={photoError('fotoPembesuk')}
            onChange={(blob) => setFieldValue(`${prefix}.fotoPembesuk`, blob)}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

export default function VisitorDataForm({ onSubmit }) {
  const [initialValues] = useState(() => ({
    tahananNama: '',
    pembesuk: [emptyVisitor()],
    alamat: '',
    noHp: '',
  }));

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values) => {
        await onSubmit(values);
      }}
    >
            {({ values, isSubmitting, setFieldValue }) => (
        <Form noValidate>
          {/* Selama mengirim, seluruh isian dikunci. */}
          <Box
            component="fieldset"
            disabled={isSubmitting}
            sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
          >
            <Stack spacing={2}>
              <FormTextField
                name="tahananNama"
                label="Nama tahanan yang dibesuk"
                placeholder="Tulis nama lengkap tahanan"
                autoComplete="off"
              />

              <FieldArray name="pembesuk">
                {({ push, remove }) => (
                  <Stack spacing={2}>
                    {values.pembesuk.map((visitor, i) => (
                      <VisitorFields
                        key={visitor.id}
                        index={i}
                        visitor={visitor}
                        canRemove={values.pembesuk.length > 1}
                        onRemove={() => remove(i)}
                      />
                    ))}

                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      disabled={values.pembesuk.length >= MAX_VISITORS}
                      onClick={() => push(emptyVisitor())}
                    >
                      Tambah pembesuk
                      {values.pembesuk.length >= MAX_VISITORS
                        ? ` (maksimal ${MAX_VISITORS})`
                        : ''}
                    </Button>
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{ color: 'text.secondary' }}
                    >
                      Jumlah pembesuk: {values.pembesuk.length} (dihitung otomatis).
                    </Typography>
                  </Stack>
                )}
              </FieldArray>

              <FormTextField
                name="alamat"
                label="Alamat"
                placeholder="Alamat lengkap"
                multiline
                minRows={2}
              />

              <FormTextField
                name="noHp"
                label="Nomor HP"
                placeholder="08xxxxxxxxxx"
                autoComplete="off"
                slotProps={{ htmlInput: { inputMode: 'tel' } }}
                helperText="Nomor yang bisa dihubungi petugas"
                onChange={(e) =>
                  setFieldValue('noHp', e.target.value.replace(/[^\d+]/g, '').slice(0, 15))
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim pendaftaran'}
              </Button>
            </Stack>
          </Box>
        </Form>
      )}
    </Formik>
  );
}