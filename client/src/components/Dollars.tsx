import { NumberFormatter, Text, TextProps } from "@mantine/core";
import Decimal from "decimal.js";

interface DollarsProps {
  value?: string;
}

function Dollars({ value, ...rest }: DollarsProps & TextProps) {
  return (
    value && (
      <Text display="inline-flex" {...rest}>
        <NumberFormatter
          prefix="$"
          value={new Decimal(value).toDecimalPlaces(2).toString()}
          thousandSeparator
        />
      </Text>
    )
  );
}

export default Dollars;
