// Formulir data pembesuk (dinamis): satu orang atau lebih, tombol "Tambah pembesuk".
// Tahap 2: hanya isian teks + validasi. Foto ditambahkan di tahap 4.
import { Formik, Form, FieldArray, getIn, useFormikContext } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

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

const emptyVisitor = () => ({
  nama: '',
  nik: '',
  noHp: '',
  hubungan: '',
  alamat: '',
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
      // this.from[1].value = seluruh isi form
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
});

const schema = Yup.object({
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

export default function VisitorDataForm({ onSubmit }) {
  return (
    <Formik
      initialValues={{ pembesuk: [emptyVisitor()] }}
      validationSchema={schema}
      onSubmit={(values) => onSubmit(values)}
    >
      {({ values, setFieldValue }) => (
        <Form noValidate>
          <FieldArray name="pembesuk">
            {({ push, remove }) => (
              <Stack spacing={2}>
                {values.pembesuk.map((visitor, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography fontWeight={700}>Pembesuk {i + 1}</Typography>
                      {values.pembesuk.length > 1 && (
                        <IconButton
                          aria-label={`Hapus pembesuk ${i + 1}`}
                          color="error"
                          onClick={() => remove(i)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Stack spacing={2}>
                      <FormTextField
                        name={`pembesuk.${i}.nama`}
                        label="Nama lengkap"
                        autoComplete="off"
                      />
                      <FormTextField
                        name={`pembesuk.${i}.nik`}
                        label="NIK"
                        autoComplete="off"
                        inputProps={{ inputMode: 'numeric', maxLength: 16 }}
                        helperText={`${visitor.nik.length}/16 digit`}
                        // Hanya angka, maksimal 16 digit
                        onChange={(e) =>
                          setFieldValue(
                            `pembesuk.${i}.nik`,
                            e.target.value.replace(/\D/g, '').slice(0, 16)
                          )
                        }
                      />
                      <FormTextField
                        name={`pembesuk.${i}.noHp`}
                        label="Nomor HP"
                        autoComplete="off"
                        inputProps={{ inputMode: 'tel' }}
                        onChange={(e) =>
                          setFieldValue(
                            `pembesuk.${i}.noHp`,
                            e.target.value.replace(/[^\d+]/g, '').slice(0, 15)
                          )
                        }
                      />
                      <FormTextField
                        select
                        name={`pembesuk.${i}.hubungan`}
                        label="Hubungan dengan tahanan"
                      >
                        {HUBUNGAN.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </FormTextField>
                      <FormTextField
                        name={`pembesuk.${i}.alamat`}
                        label="Alamat"
                        multiline
                        minRows={2}
                      />
                    </Stack>
                  </Paper>
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

                <Button type="submit" variant="contained" size="large">
                  Kirim pendaftaran
                </Button>
              </Stack>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
}