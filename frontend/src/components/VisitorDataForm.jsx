// Formulir data pembesuk (dinamis): pilih tahanan, lalu satu pembesuk atau lebih.
// Tahap 2: isian + validasi. Tahap 3: cari tahanan + cek NIK lama. Tahap 4: foto + kirim.
import { useEffect, useState } from 'react';
import { Formik, Form, FieldArray, getIn, useFormikContext } from 'formik';
import * as Yup from 'yup';
import {
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
import { findVisitorByNik } from '../services/public.service';

const MAX_VISITORS = 5;

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
  noHp: '',
  hubungan: '',
  alamat: '',
  fotoKtp: null,
  fotoPembesuk: null,
  nikChecked: '', // NIK yang sudah dicek ke server
  nikStatus: '', // 'lama' | 'baru' | 'gagal'
});

const visitorSchema = Yup.object({
  nama: Yup.string()
    .trim()
    .min(3, 'Nama minimal 3 huruf')
    .required('Nama wajib diisi'),
  nik: Yup.string()
    .required('NIK wajib diisi')
    .matches(/^\d{16}$/, 'NIK harus 16 digit angka')
    .test('nik-unik', 'NIK sama dengan pembesuk lain di form ini', function (value) {
      const list = this.from?.[1]?.value?.pembesuk ?? [];
      return list.filter((p) => p.nik === value).length <= 1;
    }),
  noHp: Yup.string()
    .required('Nomor HP wajib diisi')
    .matches(/^(\+62|62|0)8\d{8,12}$/, 'Nomor HP tidak valid, contoh: 081234567890'),
  hubungan: Yup.string().required('Hubungan dengan tahanan wajib dipilih'),
  alamat: Yup.string()
    .trim()
    .min(5, 'Alamat minimal 5 karakter')
    .required('Alamat wajib diisi'),
  fotoKtp: Yup.mixed().required('Foto KTP wajib diambil'),
  fotoPembesuk: Yup.mixed().required('Foto pembesuk wajib diambil'),
});

const schema = Yup.object({
    tahanan: Yup.string()
    .trim()
    .min(3, 'Nama tahanan minimal 3 huruf')
    .required('Nama tahanan wajib diisi'),
  pembesuk: Yup.array()
    .of(visitorSchema)
    .min(1, 'Minimal 1 pembesuk')
    .max(MAX_VISITORS, `Maksimal ${MAX_VISITORS} pembesuk`),
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
  const { nik, nikChecked, nikStatus } = visitor;

  // Tahap 3: begitu NIK 16 digit, cek apakah pembesuk pernah terdaftar.
  useEffect(() => {
    if (nik.length !== 16 || nikChecked === nik) return undefined;

    const controller = new AbortController();
    findVisitorByNik(nik, controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return;
        if (found) {
          if (found.nama) setFieldValue(`${prefix}.nama`, found.nama);
          if (found.noHp) setFieldValue(`${prefix}.noHp`, found.noHp);
          if (found.alamat) setFieldValue(`${prefix}.alamat`, found.alamat);
          if (HUBUNGAN.includes(found.hubungan)) {
            setFieldValue(`${prefix}.hubungan`, found.hubungan);
          }
        }
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
    else if (nikStatus === 'lama') {
      nikHelper = 'Pembesuk pernah terdaftar. Data terisi otomatis, mohon periksa kembali.';
    } else if (nikStatus === 'gagal') {
      nikHelper = 'Pengecekan NIK gagal. Isi data secara manual.';
    }
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
        <Typography fontWeight={700}>Pembesuk {index + 1}</Typography>
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
          name={`${prefix}.nik`}
          label="NIK"
          autoComplete="off"
          inputProps={{ inputMode: 'numeric', maxLength: 16 }}
          helperText={nikHelper}
          onChange={(e) =>
            setFieldValue(`${prefix}.nik`, e.target.value.replace(/\D/g, '').slice(0, 16))
          }
        />
        <FormTextField name={`${prefix}.nama`} label="Nama lengkap" autoComplete="off" />
        <FormTextField
          name={`${prefix}.noHp`}
          label="Nomor HP"
          autoComplete="off"
          inputProps={{ inputMode: 'tel' }}
          onChange={(e) =>
            setFieldValue(`${prefix}.noHp`, e.target.value.replace(/[^\d+]/g, '').slice(0, 15))
          }
        />
        <FormTextField select name={`${prefix}.hubungan`} label="Hubungan dengan tahanan">
          {HUBUNGAN.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </FormTextField>
        <FormTextField name={`${prefix}.alamat`} label="Alamat" multiline minRows={2} />

        <PhotoField
          label="Foto KTP"
          capture="environment"
          value={visitor.fotoKtp}
          error={photoError('fotoKtp')}
          onChange={(blob) => setFieldValue(`${prefix}.fotoKtp`, blob)}
        />
        <PhotoField
          label="Foto pembesuk (wajah)"
          capture="user"
          value={visitor.fotoPembesuk}
          error={photoError('fotoPembesuk')}
          onChange={(blob) => setFieldValue(`${prefix}.fotoPembesuk`, blob)}
        />
      </Stack>
    </Paper>
  );
}

export default function VisitorDataForm({ onSubmit }) {
  const [initialValues] = useState(() => ({
    tahanan: '',
    pembesuk: [emptyVisitor()],
  }));

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values) => {
        await onSubmit(values);
      }}
    >
       {({ values, isSubmitting }) => (
        <Form noValidate>
          {/* Selama mengirim, seluruh isian dikunci. */}
          <Box
            component="fieldset"
            disabled={isSubmitting}
            sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
          >
            <Stack spacing={2}>
             <FormTextField
                name="tahanan"
                label="Nama tahanan yang dibesuk"
                autoComplete="off"
                helperText="Tulis sesuai nama asli tahanan"
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
                  </Stack>
                )}
              </FieldArray>

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