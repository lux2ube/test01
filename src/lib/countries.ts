export interface Country {
  code: string;
  name: string;
  nameAr: string;
  flag: string;
  dialCode?: string;
}

export const countries: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', dialCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', flag: '🇦🇪', dialCode: '+971' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', dialCode: '+20' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', flag: '🇾🇪', dialCode: '+967' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧', dialCode: '+961' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', dialCode: '+965' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', dialCode: '+974' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭', dialCode: '+973' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان', flag: '🇴🇲', dialCode: '+968' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', dialCode: '+964' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', flag: '🇸🇾', dialCode: '+963' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', flag: '🇵🇸', dialCode: '+970' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', flag: '🇸🇩', dialCode: '+249' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', flag: '🇹🇳', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', flag: '🇩🇿', dialCode: '+213' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', flag: '🇲🇦', dialCode: '+212' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', flag: '🇱🇾', dialCode: '+218' },
  { code: 'MR', name: 'Mauritania', nameAr: 'موريتانيا', flag: '🇲🇷', dialCode: '+222' },
  { code: 'SO', name: 'Somalia', nameAr: 'الصومال', flag: '🇸🇴', dialCode: '+252' },
  { code: 'DJ', name: 'Djibouti', nameAr: 'جيبوتي', flag: '🇩🇯', dialCode: '+253' },
  { code: 'KM', name: 'Comoros', nameAr: 'جزر القمر', flag: '🇰🇲', dialCode: '+269' },
  { code: 'AF', name: 'Afghanistan', nameAr: 'أفغانستان', flag: '🇦🇫', dialCode: '+93' },
  { code: 'AL', name: 'Albania', nameAr: 'ألبانيا', flag: '🇦🇱', dialCode: '+355' },
  { code: 'AD', name: 'Andorra', nameAr: 'أندورا', flag: '🇦🇩', dialCode: '+376' },
  { code: 'AO', name: 'Angola', nameAr: 'أنغولا', flag: '🇦🇴', dialCode: '+244' },
  { code: 'AG', name: 'Antigua and Barbuda', nameAr: 'أنتيغوا وبربودا', flag: '🇦🇬', dialCode: '+1268' },
  { code: 'AR', name: 'Argentina', nameAr: 'الأرجنتين', flag: '🇦🇷', dialCode: '+54' },
  { code: 'AM', name: 'Armenia', nameAr: 'أرمينيا', flag: '🇦🇲', dialCode: '+374' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', flag: '🇦🇺', dialCode: '+61' },
  { code: 'AT', name: 'Austria', nameAr: 'النمسا', flag: '🇦🇹', dialCode: '+43' },
  { code: 'AZ', name: 'Azerbaijan', nameAr: 'أذربيجان', flag: '🇦🇿', dialCode: '+994' },
  { code: 'BS', name: 'Bahamas', nameAr: 'الباهاماس', flag: '🇧🇸', dialCode: '+1242' },
  { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش', flag: '🇧🇩', dialCode: '+880' },
  { code: 'BB', name: 'Barbados', nameAr: 'بربادوس', flag: '🇧🇧', dialCode: '+1246' },
  { code: 'BY', name: 'Belarus', nameAr: 'بيلاروسيا', flag: '🇧🇾', dialCode: '+375' },
  { code: 'BE', name: 'Belgium', nameAr: 'بلجيكا', flag: '🇧🇪', dialCode: '+32' },
  { code: 'BZ', name: 'Belize', nameAr: 'بليز', flag: '🇧🇿', dialCode: '+501' },
  { code: 'BJ', name: 'Benin', nameAr: 'بنين', flag: '🇧🇯', dialCode: '+229' },
  { code: 'BT', name: 'Bhutan', nameAr: 'بوتان', flag: '🇧🇹', dialCode: '+975' },
  { code: 'BO', name: 'Bolivia', nameAr: 'بوليفيا', flag: '🇧🇴', dialCode: '+591' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nameAr: 'البوسنة والهرسك', flag: '🇧🇦', dialCode: '+387' },
  { code: 'BW', name: 'Botswana', nameAr: 'بوتسوانا', flag: '🇧🇼', dialCode: '+267' },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل', flag: '🇧🇷', dialCode: '+55' },
  { code: 'BN', name: 'Brunei', nameAr: 'بروناي', flag: '🇧🇳', dialCode: '+673' },
  { code: 'BG', name: 'Bulgaria', nameAr: 'بلغاريا', flag: '🇧🇬', dialCode: '+359' },
  { code: 'BF', name: 'Burkina Faso', nameAr: 'بوركينا فاسو', flag: '🇧🇫', dialCode: '+226' },
  { code: 'BI', name: 'Burundi', nameAr: 'بوروندي', flag: '🇧🇮', dialCode: '+257' },
  { code: 'CV', name: 'Cape Verde', nameAr: 'الرأس الأخضر', flag: '🇨🇻', dialCode: '+238' },
  { code: 'KH', name: 'Cambodia', nameAr: 'كمبوديا', flag: '🇰🇭', dialCode: '+855' },
  { code: 'CM', name: 'Cameroon', nameAr: 'الكاميرون', flag: '🇨🇲', dialCode: '+237' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', flag: '🇨🇦', dialCode: '+1' },
  { code: 'CF', name: 'Central African Republic', nameAr: 'جمهورية أفريقيا الوسطى', flag: '🇨🇫', dialCode: '+236' },
  { code: 'TD', name: 'Chad', nameAr: 'تشاد', flag: '🇹🇩', dialCode: '+235' },
  { code: 'CL', name: 'Chile', nameAr: 'تشيلي', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CN', name: 'China', nameAr: 'الصين', flag: '🇨🇳', dialCode: '+86' },
  { code: 'CO', name: 'Colombia', nameAr: 'كولومبيا', flag: '🇨🇴', dialCode: '+57' },
  { code: 'CG', name: 'Congo', nameAr: 'الكونغو', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CD', name: 'Congo (DRC)', nameAr: 'جمهورية الكونغو الديمقراطية', flag: '🇨🇩', dialCode: '+243' },
  { code: 'CR', name: 'Costa Rica', nameAr: 'كوستاريكا', flag: '🇨🇷', dialCode: '+506' },
  { code: 'CI', name: 'Ivory Coast', nameAr: 'ساحل العاج', flag: '🇨🇮', dialCode: '+225' },
  { code: 'HR', name: 'Croatia', nameAr: 'كرواتيا', flag: '🇭🇷', dialCode: '+385' },
  { code: 'CU', name: 'Cuba', nameAr: 'كوبا', flag: '🇨🇺', dialCode: '+53' },
  { code: 'CY', name: 'Cyprus', nameAr: 'قبرص', flag: '🇨🇾', dialCode: '+357' },
  { code: 'CZ', name: 'Czech Republic', nameAr: 'جمهورية التشيك', flag: '🇨🇿', dialCode: '+420' },
  { code: 'DK', name: 'Denmark', nameAr: 'الدنمارك', flag: '🇩🇰', dialCode: '+45' },
  { code: 'DM', name: 'Dominica', nameAr: 'دومينيكا', flag: '🇩🇲', dialCode: '+1767' },
  { code: 'DO', name: 'Dominican Republic', nameAr: 'جمهورية الدومينيكان', flag: '🇩🇴', dialCode: '+1809' },
  { code: 'EC', name: 'Ecuador', nameAr: 'الإكوادور', flag: '🇪🇨', dialCode: '+593' },
  { code: 'SV', name: 'El Salvador', nameAr: 'السلفادور', flag: '🇸🇻', dialCode: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', nameAr: 'غينيا الاستوائية', flag: '🇬🇶', dialCode: '+240' },
  { code: 'ER', name: 'Eritrea', nameAr: 'إريتريا', flag: '🇪🇷', dialCode: '+291' },
  { code: 'EE', name: 'Estonia', nameAr: 'إستونيا', flag: '🇪🇪', dialCode: '+372' },
  { code: 'SZ', name: 'Eswatini', nameAr: 'إسواتيني', flag: '🇸🇿', dialCode: '+268' },
  { code: 'ET', name: 'Ethiopia', nameAr: 'إثيوبيا', flag: '🇪🇹', dialCode: '+251' },
  { code: 'FJ', name: 'Fiji', nameAr: 'فيجي', flag: '🇫🇯', dialCode: '+679' },
  { code: 'FI', name: 'Finland', nameAr: 'فنلندا', flag: '🇫🇮', dialCode: '+358' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', flag: '🇫🇷', dialCode: '+33' },
  { code: 'GA', name: 'Gabon', nameAr: 'الغابون', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GM', name: 'Gambia', nameAr: 'غامبيا', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GE', name: 'Georgia', nameAr: 'جورجيا', flag: '🇬🇪', dialCode: '+995' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', flag: '🇩🇪', dialCode: '+49' },
  { code: 'GH', name: 'Ghana', nameAr: 'غانا', flag: '🇬🇭', dialCode: '+233' },
  { code: 'GR', name: 'Greece', nameAr: 'اليونان', flag: '🇬🇷', dialCode: '+30' },
  { code: 'GD', name: 'Grenada', nameAr: 'غرينادا', flag: '🇬🇩', dialCode: '+1473' },
  { code: 'GT', name: 'Guatemala', nameAr: 'غواتيمالا', flag: '🇬🇹', dialCode: '+502' },
  { code: 'GN', name: 'Guinea', nameAr: 'غينيا', flag: '🇬🇳', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', nameAr: 'غينيا بيساو', flag: '🇬🇼', dialCode: '+245' },
  { code: 'GY', name: 'Guyana', nameAr: 'غيانا', flag: '🇬🇾', dialCode: '+592' },
  { code: 'HT', name: 'Haiti', nameAr: 'هايتي', flag: '🇭🇹', dialCode: '+509' },
  { code: 'VA', name: 'Vatican City', nameAr: 'الفاتيكان', flag: '🇻🇦', dialCode: '+379' },
  { code: 'HN', name: 'Honduras', nameAr: 'هندوراس', flag: '🇭🇳', dialCode: '+504' },
  { code: 'HK', name: 'Hong Kong', nameAr: 'هونغ كونغ', flag: '🇭🇰', dialCode: '+852' },
  { code: 'HU', name: 'Hungary', nameAr: 'هنغاريا', flag: '🇭🇺', dialCode: '+36' },
  { code: 'IS', name: 'Iceland', nameAr: 'آيسلندا', flag: '🇮🇸', dialCode: '+354' },
  { code: 'IN', name: 'India', nameAr: 'الهند', flag: '🇮🇳', dialCode: '+91' },
  { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا', flag: '🇮🇩', dialCode: '+62' },
  { code: 'IR', name: 'Iran', nameAr: 'إيران', flag: '🇮🇷', dialCode: '+98' },
  { code: 'IE', name: 'Ireland', nameAr: 'أيرلندا', flag: '🇮🇪', dialCode: '+353' },
  { code: 'IL', name: 'Israel', nameAr: 'إسرائيل', flag: '🇮🇱', dialCode: '+972' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', flag: '🇮🇹', dialCode: '+39' },
  { code: 'JM', name: 'Jamaica', nameAr: 'جامايكا', flag: '🇯🇲', dialCode: '+1876' },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KZ', name: 'Kazakhstan', nameAr: 'كازاخستان', flag: '🇰🇿', dialCode: '+7' },
  { code: 'KE', name: 'Kenya', nameAr: 'كينيا', flag: '🇰🇪', dialCode: '+254' },
  { code: 'KI', name: 'Kiribati', nameAr: 'كيريباتي', flag: '🇰🇮', dialCode: '+686' },
  { code: 'KP', name: 'North Korea', nameAr: 'كوريا الشمالية', flag: '🇰🇵', dialCode: '+850' },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية', flag: '🇰🇷', dialCode: '+82' },
  { code: 'KG', name: 'Kyrgyzstan', nameAr: 'قيرغيزستان', flag: '🇰🇬', dialCode: '+996' },
  { code: 'LA', name: 'Laos', nameAr: 'لاوس', flag: '🇱🇦', dialCode: '+856' },
  { code: 'LV', name: 'Latvia', nameAr: 'لاتفيا', flag: '🇱🇻', dialCode: '+371' },
  { code: 'LS', name: 'Lesotho', nameAr: 'ليسوتو', flag: '🇱🇸', dialCode: '+266' },
  { code: 'LR', name: 'Liberia', nameAr: 'ليبيريا', flag: '🇱🇷', dialCode: '+231' },
  { code: 'LI', name: 'Liechtenstein', nameAr: 'ليختنشتاين', flag: '🇱🇮', dialCode: '+423' },
  { code: 'LT', name: 'Lithuania', nameAr: 'ليتوانيا', flag: '🇱🇹', dialCode: '+370' },
  { code: 'LU', name: 'Luxembourg', nameAr: 'لوكسمبورغ', flag: '🇱🇺', dialCode: '+352' },
  { code: 'MO', name: 'Macao', nameAr: 'ماكاو', flag: '🇲🇴', dialCode: '+853' },
  { code: 'MK', name: 'North Macedonia', nameAr: 'مقدونيا الشمالية', flag: '🇲🇰', dialCode: '+389' },
  { code: 'MG', name: 'Madagascar', nameAr: 'مدغشقر', flag: '🇲🇬', dialCode: '+261' },
  { code: 'MW', name: 'Malawi', nameAr: 'ملاوي', flag: '🇲🇼', dialCode: '+265' },
  { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا', flag: '🇲🇾', dialCode: '+60' },
  { code: 'MV', name: 'Maldives', nameAr: 'المالديف', flag: '🇲🇻', dialCode: '+960' },
  { code: 'ML', name: 'Mali', nameAr: 'مالي', flag: '🇲🇱', dialCode: '+223' },
  { code: 'MT', name: 'Malta', nameAr: 'مالطا', flag: '🇲🇹', dialCode: '+356' },
  { code: 'MH', name: 'Marshall Islands', nameAr: 'جزر مارشال', flag: '🇲🇭', dialCode: '+692' },
  { code: 'MU', name: 'Mauritius', nameAr: 'موريشيوس', flag: '🇲🇺', dialCode: '+230' },
  { code: 'MX', name: 'Mexico', nameAr: 'المكسيك', flag: '🇲🇽', dialCode: '+52' },
  { code: 'FM', name: 'Micronesia', nameAr: 'ميكرونيزيا', flag: '🇫🇲', dialCode: '+691' },
  { code: 'MD', name: 'Moldova', nameAr: 'مولدوفا', flag: '🇲🇩', dialCode: '+373' },
  { code: 'MC', name: 'Monaco', nameAr: 'موناكو', flag: '🇲🇨', dialCode: '+377' },
  { code: 'MN', name: 'Mongolia', nameAr: 'منغوليا', flag: '🇲🇳', dialCode: '+976' },
  { code: 'ME', name: 'Montenegro', nameAr: 'الجبل الأسود', flag: '🇲🇪', dialCode: '+382' },
  { code: 'MZ', name: 'Mozambique', nameAr: 'موزمبيق', flag: '🇲🇿', dialCode: '+258' },
  { code: 'MM', name: 'Myanmar', nameAr: 'ميانمار', flag: '🇲🇲', dialCode: '+95' },
  { code: 'NA', name: 'Namibia', nameAr: 'ناميبيا', flag: '🇳🇦', dialCode: '+264' },
  { code: 'NR', name: 'Nauru', nameAr: 'ناورو', flag: '🇳🇷', dialCode: '+674' },
  { code: 'NP', name: 'Nepal', nameAr: 'نيبال', flag: '🇳🇵', dialCode: '+977' },
  { code: 'NL', name: 'Netherlands', nameAr: 'هولندا', flag: '🇳🇱', dialCode: '+31' },
  { code: 'NZ', name: 'New Zealand', nameAr: 'نيوزيلندا', flag: '🇳🇿', dialCode: '+64' },
  { code: 'NI', name: 'Nicaragua', nameAr: 'نيكاراغوا', flag: '🇳🇮', dialCode: '+505' },
  { code: 'NE', name: 'Niger', nameAr: 'النيجر', flag: '🇳🇪', dialCode: '+227' },
  { code: 'NG', name: 'Nigeria', nameAr: 'نيجيريا', flag: '🇳🇬', dialCode: '+234' },
  { code: 'NO', name: 'Norway', nameAr: 'النرويج', flag: '🇳🇴', dialCode: '+47' },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان', flag: '🇵🇰', dialCode: '+92' },
  { code: 'PW', name: 'Palau', nameAr: 'بالاو', flag: '🇵🇼', dialCode: '+680' },
  { code: 'PA', name: 'Panama', nameAr: 'بنما', flag: '🇵🇦', dialCode: '+507' },
  { code: 'PG', name: 'Papua New Guinea', nameAr: 'بابوا غينيا الجديدة', flag: '🇵🇬', dialCode: '+675' },
  { code: 'PY', name: 'Paraguay', nameAr: 'باراغواي', flag: '🇵🇾', dialCode: '+595' },
  { code: 'PE', name: 'Peru', nameAr: 'بيرو', flag: '🇵🇪', dialCode: '+51' },
  { code: 'PH', name: 'Philippines', nameAr: 'الفلبين', flag: '🇵🇭', dialCode: '+63' },
  { code: 'PL', name: 'Poland', nameAr: 'بولندا', flag: '🇵🇱', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', nameAr: 'البرتغال', flag: '🇵🇹', dialCode: '+351' },
  { code: 'PR', name: 'Puerto Rico', nameAr: 'بورتوريكو', flag: '🇵🇷', dialCode: '+1787' },
  { code: 'RO', name: 'Romania', nameAr: 'رومانيا', flag: '🇷🇴', dialCode: '+40' },
  { code: 'RU', name: 'Russia', nameAr: 'روسيا', flag: '🇷🇺', dialCode: '+7' },
  { code: 'RW', name: 'Rwanda', nameAr: 'رواندا', flag: '🇷🇼', dialCode: '+250' },
  { code: 'KN', name: 'Saint Kitts and Nevis', nameAr: 'سانت كيتس ونيفيس', flag: '🇰🇳', dialCode: '+1869' },
  { code: 'LC', name: 'Saint Lucia', nameAr: 'سانت لوسيا', flag: '🇱🇨', dialCode: '+1758' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', nameAr: 'سانت فينسنت والغرينادين', flag: '🇻🇨', dialCode: '+1784' },
  { code: 'WS', name: 'Samoa', nameAr: 'ساموا', flag: '🇼🇸', dialCode: '+685' },
  { code: 'SM', name: 'San Marino', nameAr: 'سان مارينو', flag: '🇸🇲', dialCode: '+378' },
  { code: 'ST', name: 'Sao Tome and Principe', nameAr: 'ساو تومي وبرينسيب', flag: '🇸🇹', dialCode: '+239' },
  { code: 'SN', name: 'Senegal', nameAr: 'السنغال', flag: '🇸🇳', dialCode: '+221' },
  { code: 'RS', name: 'Serbia', nameAr: 'صربيا', flag: '🇷🇸', dialCode: '+381' },
  { code: 'SC', name: 'Seychelles', nameAr: 'سيشل', flag: '🇸🇨', dialCode: '+248' },
  { code: 'SL', name: 'Sierra Leone', nameAr: 'سيراليون', flag: '🇸🇱', dialCode: '+232' },
  { code: 'SG', name: 'Singapore', nameAr: 'سنغافورة', flag: '🇸🇬', dialCode: '+65' },
  { code: 'SK', name: 'Slovakia', nameAr: 'سلوفاكيا', flag: '🇸🇰', dialCode: '+421' },
  { code: 'SI', name: 'Slovenia', nameAr: 'سلوفينيا', flag: '🇸🇮', dialCode: '+386' },
  { code: 'SB', name: 'Solomon Islands', nameAr: 'جزر سليمان', flag: '🇸🇧', dialCode: '+677' },
  { code: 'ZA', name: 'South Africa', nameAr: 'جنوب أفريقيا', flag: '🇿🇦', dialCode: '+27' },
  { code: 'SS', name: 'South Sudan', nameAr: 'جنوب السودان', flag: '🇸🇸', dialCode: '+211' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', flag: '🇪🇸', dialCode: '+34' },
  { code: 'LK', name: 'Sri Lanka', nameAr: 'سريلانكا', flag: '🇱🇰', dialCode: '+94' },
  { code: 'SR', name: 'Suriname', nameAr: 'سورينام', flag: '🇸🇷', dialCode: '+597' },
  { code: 'SE', name: 'Sweden', nameAr: 'السويد', flag: '🇸🇪', dialCode: '+46' },
  { code: 'CH', name: 'Switzerland', nameAr: 'سويسرا', flag: '🇨🇭', dialCode: '+41' },
  { code: 'TW', name: 'Taiwan', nameAr: 'تايوان', flag: '🇹🇼', dialCode: '+886' },
  { code: 'TJ', name: 'Tajikistan', nameAr: 'طاجيكستان', flag: '🇹🇯', dialCode: '+992' },
  { code: 'TZ', name: 'Tanzania', nameAr: 'تنزانيا', flag: '🇹🇿', dialCode: '+255' },
  { code: 'TH', name: 'Thailand', nameAr: 'تايلاند', flag: '🇹🇭', dialCode: '+66' },
  { code: 'TL', name: 'Timor-Leste', nameAr: 'تيمور الشرقية', flag: '🇹🇱', dialCode: '+670' },
  { code: 'TG', name: 'Togo', nameAr: 'توغو', flag: '🇹🇬', dialCode: '+228' },
  { code: 'TO', name: 'Tonga', nameAr: 'تونغا', flag: '🇹🇴', dialCode: '+676' },
  { code: 'TT', name: 'Trinidad and Tobago', nameAr: 'ترينيداد وتوباغو', flag: '🇹🇹', dialCode: '+1868' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', flag: '🇹🇷', dialCode: '+90' },
  { code: 'TM', name: 'Turkmenistan', nameAr: 'تركمانستان', flag: '🇹🇲', dialCode: '+993' },
  { code: 'TV', name: 'Tuvalu', nameAr: 'توفالو', flag: '🇹🇻', dialCode: '+688' },
  { code: 'UG', name: 'Uganda', nameAr: 'أوغندا', flag: '🇺🇬', dialCode: '+256' },
  { code: 'UA', name: 'Ukraine', nameAr: 'أوكرانيا', flag: '🇺🇦', dialCode: '+380' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', flag: '🇬🇧', dialCode: '+44' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', flag: '🇺🇸', dialCode: '+1' },
  { code: 'UY', name: 'Uruguay', nameAr: 'أوروغواي', flag: '🇺🇾', dialCode: '+598' },
  { code: 'UZ', name: 'Uzbekistan', nameAr: 'أوزبكستان', flag: '🇺🇿', dialCode: '+998' },
  { code: 'VU', name: 'Vanuatu', nameAr: 'فانواتو', flag: '🇻🇺', dialCode: '+678' },
  { code: 'VE', name: 'Venezuela', nameAr: 'فنزويلا', flag: '🇻🇪', dialCode: '+58' },
  { code: 'VN', name: 'Vietnam', nameAr: 'فيتنام', flag: '🇻🇳', dialCode: '+84' },
  { code: 'ZM', name: 'Zambia', nameAr: 'زامبيا', flag: '🇿🇲', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', nameAr: 'زيمبابوي', flag: '🇿🇼', dialCode: '+263' },
  { code: 'GI', name: 'Gibraltar', nameAr: 'جبل طارق', flag: '🇬🇮', dialCode: '+350' },
  { code: 'KY', name: 'Cayman Islands', nameAr: 'جزر كايمان', flag: '🇰🇾', dialCode: '+1345' },
  { code: 'BM', name: 'Bermuda', nameAr: 'برمودا', flag: '🇧🇲', dialCode: '+1441' },
  { code: 'VG', name: 'British Virgin Islands', nameAr: 'جزر العذراء البريطانية', flag: '🇻🇬', dialCode: '+1284' },
  { code: 'IM', name: 'Isle of Man', nameAr: 'جزيرة مان', flag: '🇮🇲', dialCode: '+44' },
  { code: 'JE', name: 'Jersey', nameAr: 'جيرزي', flag: '🇯🇪', dialCode: '+44' },
  { code: 'GG', name: 'Guernsey', nameAr: 'غيرنزي', flag: '🇬🇬', dialCode: '+44' },
];

export const ARAB_COUNTRY_CODES = [
  'SA', 'AE', 'EG', 'YE', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM', 
  'IQ', 'SY', 'PS', 'SD', 'TN', 'DZ', 'MA', 'LY', 'MR', 'SO', 'DJ', 'KM'
];

export const arabCountries = countries.filter(c => ARAB_COUNTRY_CODES.includes(c.code));

export const phoneCountryCodes = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS', 'SD', 'TN', 'DZ', 'MA', 'LY', 'MR', 'US', 'GB', 'TR', 'ID', 'MY'];

export function getCountryByCode(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return countries.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryName(code: string | null | undefined, lang: 'ar' | 'en' = 'ar'): string {
  const country = getCountryByCode(code);
  if (!country) return code || 'Unknown';
  return lang === 'ar' ? country.nameAr : country.name;
}

export function getCountryDisplay(code: string | null | undefined, lang: 'ar' | 'en' = 'ar'): string {
  const country = getCountryByCode(code);
  if (!country) return code || 'Unknown';
  const name = lang === 'ar' ? country.nameAr : country.name;
  return `${country.flag} ${name}`;
}

export function getCountriesForSelect(lang: 'ar' | 'en' = 'ar', onlyArab: boolean = false) {
  const list = onlyArab ? arabCountries : countries;
  return list.map(c => ({
    value: c.code,
    label: lang === 'ar' ? c.nameAr : c.name,
    flag: c.flag,
    display: `${c.flag} ${lang === 'ar' ? c.nameAr : c.name}`,
  }));
}

export function getCountryCodeFromName(name: string): string | undefined {
  const normalized = name.toLowerCase().trim();
  const country = countries.find(c => 
    c.name.toLowerCase() === normalized || 
    c.nameAr === name ||
    c.code.toLowerCase() === normalized
  );
  return country?.code;
}
