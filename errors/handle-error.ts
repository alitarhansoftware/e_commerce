const getErrorMessageFromZodError = (error: any): string | null => {
  console.log(error);
  if (error.issues && error.issues.length > 0) {
    const invalidField = error.issues[0].path[0];
    if (invalidField === "phoneNumber") {
      return "Lütfen geçerli bir telefon numarası girin.";
    } else if (invalidField === "email") {
      return "Lütfen geçerli bir email adresi girin.";
    } else if (invalidField === "firstName") {
      return "İsim uzunluk sınırını aştınız.";
    } else if (invalidField === "lastName") {
      return "Soyisim uzunluk sınırını aştınız.";
    } else if (invalidField === "birthDate") {
      return "Doğru bir doğum tarihi formatı giriniz YYYY-MM-DD";
    } else {
      return "Lütfen tüm alanları doğru şekilde doldurun.";
    }
  }
  return null;
};

const getErrorMessageFromPostgres = (error: any) => {
  console.log(error);
  switch (error.code) {
    case "23505":
      if (error.constraint === "email_unique") {
        return "Bu e-posta adresi zaten kayıtlı.";
      } else if (error.constraint === "unique_phone_number") {
        return "Bu telefon numarası zaten kayıtlı.";
      }
      break;
    case "22001":
      return "Uzunluk sınırını aştınız parametrelerinizi kontrol ediniz.";
    case "23503":
      if (
        error.constraint === "useraddress_userid_fkey" ||
        error.constraint === "orders_userid_fkey"
      ) {
        return "Bu userId sistemde kayıtlı değil.";
      }
      break;
    default:
      return null;
  }
};

const handleZodAndPostgresError = async (error: any, res: any) => {
  const zodErrorMessage = getErrorMessageFromZodError(error);
  if (zodErrorMessage) {
    return res.status(400).json({ message: zodErrorMessage });
  }
  const postgresErrorMessage = getErrorMessageFromPostgres(error);
  if (postgresErrorMessage) {
    return res.status(400).json({ message: postgresErrorMessage });
  }
  return res.status(400).json({ message: "Bir hata oluştu." });
};

const handleOrderError = async (error: any, res: any) => {
  const zodErrorMessage = getErrorMessageFromZodError(error);
  if (zodErrorMessage) {
    return res.status(400).json({ message: zodErrorMessage });
  }
  const postgresErrorMessage = getErrorMessageFromPostgres(error);
  if (postgresErrorMessage) {
    return res.status(400).json({ message: postgresErrorMessage });
  }
  if (error.code === "INVALID_PRODUCT_ORDER") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === "INVALID_ADDRESS_ORDER") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === "INSUFFICIENT_ STOCK_ORDER") {
    return res.status(400).json({ message: error.message });
  }
  return res.status(400).json({ message: "Bir hata oluştu." });
};

export {
  handleOrderError,
  handleZodAndPostgresError,
  getErrorMessageFromPostgres,
  getErrorMessageFromZodError,
};
