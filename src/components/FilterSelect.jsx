import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

/**
 * MUI 기본 Select/드롭다운 사용.
 */
export function FilterSelect({ label, value, onChange, options, renderOption, sx = {} }) {
  return (
    <FormControl size="small" fullWidth variant="outlined" sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={onChange}>
        <MenuItem value="">전체</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value ?? opt} value={opt.value ?? opt}>
            {renderOption ? renderOption(opt) : (opt.label ?? opt)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
