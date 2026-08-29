const fs = require('fs');
let code = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

const validationLogic = `
  const validateForm = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    const udyamRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
    const bankAccRegex = /^\\d{9,18}$/;

    if (!panRegex.test(formData.pan.toUpperCase())) {
      return "Invalid PAN format. Must be 5 Letters, 4 Digits, 1 Letter (e.g., ABCDE1234F).";
    }
    if (!gstinRegex.test(formData.gstin.toUpperCase())) {
      return "Invalid GSTIN format. Must be a valid 15-character GST number.";
    }
    if (formData.cin && !cinRegex.test(formData.cin.toUpperCase())) {
      return "Invalid CIN format. Must be a standard 21-character Corporate Identity Number.";
    }
    if (formData.msme && !udyamRegex.test(formData.msme.toUpperCase())) {
      return "Invalid Udyam Number format. Must follow UDYAM-XX-00-0000000.";
    }
    if (!ifscRegex.test(formData.bankIfsc.toUpperCase())) {
      return "Invalid IFSC format. Must be 4 Letters, a '0', and 6 alphanumeric characters.";
    }
    if (!bankAccRegex.test(formData.bankAccountNumber)) {
      return "Invalid Bank Account Number. Must be between 9 and 18 digits.";
    }
    if (formData.entityType === '') {
      return "Please select a Business/Entity Type.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo(0, 0);
      return;
    }
    
    setLoading(true);
`;

code = code.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*setLoading\(true\);\s*setError\(''\);/, validationLogic);

fs.writeFileSync('src/pages/Onboarding.tsx', code, 'utf8');
console.log("Added robust regex validations to Onboarding form.");
