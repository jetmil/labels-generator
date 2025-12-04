# Candle Data Import Report
**Date:** 2025-12-04
**Source:** `/mnt/c/Users/PC/Desktop/Обменник/МАСТЕРСКАЯ ЧАРОДЕЙКИ/Этикетки HTML/all_labels_magic_fixed.html`
**API Endpoint:** http://192.168.0.95:8201/api

---

## Summary

**Total Candles Extracted:** 56
**Successfully Imported:** 56
**Errors:** 0
**Skipped:** 0

---

## Categories Created

1. **Программная свеча** - 28 candles
2. **Громничная свеча** - 28 candles

---

## Extracted Data Fields

For each candle, the following data was extracted and imported:

- **name** - Candle name (e.g., "РАСЦЕП", "СВЕТЛАЯ СПИРАЛЬ")
- **category** - Category type (Программная свеча / Громничная свеча)
- **tagline** - Short tagline (e.g., "Освобождение от оков прошлого")
- **description** - Detailed description of the candle's purpose
- **practice** - Ritual text/spell (заговор) for using the candle
- **brand_name** - АРТ-СВЕЧИ
- **website** - art-svechi.ligardi.ru

---

## Complete List of Imported Candles

### Программная свеча (28 candles)

1. РАСЦЕП - Освобождение от оков прошлого
2. ОБНУЛЕНИЕ - Чистый лист для новых начинаний
3. ВОЗРОЖДЕНИЕ - Пробуждение внутреннего солнца
4. ПОТОК - Открытие небесного канала
5. РАСШИРЕНИЕ - Рост энергетического сосуда
6. НАПОЛНЕНИЕ - Полнота жизненной силы
7. МОЛИТВЕННАЯ СИЛА - Усиление священного слова
8. ОГНЕННЫЙ ВИХРЬ - Взрывная энергия действия
9. МЕДОВЫЙ ПОТОК - Сладость медленного восполнения
10. ХОРОШИЕ ОТНОШЕНИЯ НА РАБОТЕ - Гармония рабочего пространства
11. ХОРОШИЕ ОТНОШЕНИЯ С ЛЮБИМЫМ - Тепло родных сердец
12. РАЗРУШЕНИЕ ПРЕГРАД - Власть - Сила достигать цели
13. РАЗРУШЕНИЕ ПРЕГРАД - Любовь - Путь к сердцу свободен
14. РАЗРУШЕНИЕ ПРЕГРАД - Желания - Мечты становятся явью
15. РАЗРУШЕНИЕ ПРЕГРАД - Деньги - Золотые ворота открыты
16. РАЗРУШЕНИЕ ПРЕГРАД - Чистка - Тотальное освобождение
17. РАЗРУШЕНИЕ ПРЕГРАД - Разум - Ясность мысли
18. СНЯТИЕ МОРОКА - Пелена спадает с глаз
19. БУМЕРАНГ - Возврат отправителю
20. ЧЕТЫРЕ ДОРОГИ - Исцеление рода
21. СЕМЬ ДОРОГ - Все пути открыты
22. САМОЦВЕТНАЯ ГОРА - Радуга силы и защиты
23. ОГНЕРОЖДЁННАЯ - Куколка-целительница из воска
24. СИНЯЯ ГРОМНИЧНАЯ - Защита от стихийных бедствий
25. ДЕНЕЖНЫЙ РОСТ - Набор из 3 свечей
26. ПРОРЫВ - Набор из 12 свечей
27. ЗЕРКАЛЬНЫЙ ЩИТ - Защита с возвратом
28. НА БОЛЬШИЕ ДЕНЬГИ - Мощный денежный поток

### Громничная свеча (28 candles)

29. ТРИ КРАСНЫХ КОСА - С Алатырём
30. ТРИ КОРИЧНЕВЫХ КОСА - С Алатырём
31. ТРИ КОРИЧНЕВЫХ ТРИ АЛАТЫРЯ - Три мира
32. СИНИЙ-ЗЕЛЁНЫЙ-ЖЁЛТЫЙ - Три силы природы
33. ГОЛУБОЙ-ОРАНЖЕВЫЙ-ФИОЛЕТОВЫЙ - Магическая триада
34. ЧЁРНЫЙ-КРАСНЫЙ-БЕЛЫЙ - Полный цикл перехода
35. КРАСНЫЙ-БЕЛЫЙ - Сила и благословение
36. КРАСНЫЙ-СИНИЙ - Сила и мудрость
37. ЖЁЛТЫЙ-КРАСНЫЙ-СИНИЙ - Полная сила воплощения
38. ПЕРУНОВ ОГОНЬ - Чистая атака
39. ВРАТА НАВИ - Путь в Навь
40. ТРОЕСВЕТ - Сила света утроенная
41. СОЛНЕЧНАЯ ТРОИЦА - Тройной свет удачи
42. МОРОК ВЕЛЕСА - Тройное отсечение
43. ВОДНАЯ ТРОИЦА - Тройная мудрость
44. ЗАРНИЦА ТВОРЕНИЯ - Тройное творчество
45. ПАРНЫЙ СВЕТ - Выбор и баланс света
46. СВЕТЛАЯ СПИРАЛЬ - Спираль света восходящая
47. БЕЛОЯР - Мировое древо света
48. НАВЬЯ КОСА - Мировое древо отсечения
49. ВОДЯНАЯ КОСА - Мировое древо мудрости
50. ТИХИЕ ВОДЫ - Спираль покоя и движения
51. КОСА МАКОШИ - Мировое древо достатка
52. РОСТОК - Спираль роста и баланса
53. НЕБЕСНАЯ КОСА - Мировое древо ясности
54. ЛАДИНА КОСА - Мировое древо любви
55. ЛЮБОВНЫЙ ВИХРЬ - Спираль любви в паре
56. ИСКРА РАДОСТИ - Спираль творчества

---

## Technical Details

### HTML Parsing Strategy

The HTML file contained 56 label cards and 56 matching instruction cards:

- **Labels** contained: name, category, tagline, description
- **Instruction cards** contained: practice text (заговор/spell)
- Cards were paired by index (label[i] + instruction[i])

### Challenges Resolved

1. **Multiple HTML structures**: Some labels used `<div class="label-name">` while others used `<h1 class="label-name">`. Script handles both.

2. **Missing descriptions**: Some "Громничная свеча" labels had no description field - script falls back to using tagline as description.

3. **Category mapping**: API requires `category_id` instead of category name. Script automatically creates categories if they don't exist.

### Files Generated

- `/var/www/labels/backend/import_all_candles.py` - Main import script
- `/var/www/labels/backend/extracted_candles.json` - Extracted data for inspection
- `/var/www/labels/backend/IMPORT_REPORT.md` - This report

---

## Sample Data Quality Check

### РАСЦЕП (Программная свеча)
```
Name: РАСЦЕП
Tagline: Освобождение от оков прошлого
Description: Свеча глубокого очищения первой и второй чакры. Работает с центром женской силы, сексуальности и радости жизни. Растворяет блоки, связанные с нелюбовью к себе.
Practice:
Огонь горит, обиды плавит,
Что ранило — навеки оставит.
Боль уходит, пепел стынет,
Сердце чисто, душа отныне.
Любовь вхожу, любовь впускаю,
Себя прощаю, принимаю.
Да будет так.
```

### ИСКРА РАДОСТИ (Громничная свеча)
```
Name: ИСКРА РАДОСТИ
Tagline: Спираль творчества
Description: Спираль творчества
Practice:
Две оранжевых спирали горят,
Творчество и радость дарят.
Вкус к жизни возвращается,
Новые возможности открываются.
Энтузиазм во мне горит,
В начинаниях успех стоит!
```

---

## Database Verification

**Total candles in database:** 64
- 8 previously existing candles
- 56 newly imported candles

**Categories in database:** 10
- 8 pre-existing categories (1 candle each)
- 2 newly created categories:
  - Программная свеча (28 candles)
  - Громничная свеча (28 candles)

---

## Next Steps

1. ✅ All 56 candles successfully imported
2. ✅ All practice texts (заговоры) preserved with formatting
3. ✅ Categories automatically created and mapped
4. ✅ Data validated and verified in database

The import is **COMPLETE** and ready for use!

---

**Script Location:** `/var/www/labels/backend/import_all_candles.py`
**Can be re-run safely** - will skip existing candles automatically.
