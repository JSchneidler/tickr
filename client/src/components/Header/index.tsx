import { useMemo, useState } from "react";
import {
  Group,
  Button,
  Modal,
  PasswordInput,
  TextInput,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { TbSunHigh, TbMoon } from "react-icons/tb";
import { ReactSVG } from "react-svg";

import TickrLogo from "../../assets/tickr-logo.svg";
import {
  useLogoutMutation,
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
} from "../../store/api";
import { usePortfolioValue } from "../../hooks/usePortfolioValue";
import Dollars from "../Dollars";
import Gain from "../Gain";

import "./Header.css";

interface AuthFields {
  email: string;
  name?: string;
  password: string;
}

function Header() {
  const { data: user } = useMeQuery();
  const [register] = useRegisterMutation();
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();

  const portfolioValue = usePortfolioValue();

  const [opened, setOpened] = useState(false);
  const [isRegistration, setIsRegistration] = useState(false);

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });

  const form = useForm<AuthFields>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      name: undefined,
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? undefined : "Invalid email"),
    },
  });

  const onFormSubmit = useMemo(
    () =>
      form.onSubmit((values) => {
        // dispatch(isRegistration ? register({ ...values }) : login({ ...values }));
        // setOpened(false);

        // @ts-expect-error: values.name is being checked
        if (isRegistration && values.name) void register({ ...values });
        else if (!isRegistration) void login({ ...values });

        setOpened(false);
        form.reset();
      }),
    [form, isRegistration, login, register],
  );

  function onRegisterClick() {
    setIsRegistration(true);
    setOpened(true);
  }

  function onLoginClick() {
    setIsRegistration(false);
    setOpened(true);
  }

  return (
    <>
      <Modal
        opened={opened}
        title={isRegistration ? "Register" : "Login"}
        centered
        onClose={() => {
          setOpened(false);
        }}
      >
        <form
          onSubmit={onFormSubmit}
          // onSubmit={form.onSubmit((values) => {
          //   // TODO: Move to function, don't close unless success
          //   // @ts-expect-error: values.name is being checked
          //   if (isRegistration && values.name) void register({ ...values });
          //   else if (!isRegistration) void login({ ...values });

          //   setOpened(false);
          //   form.reset();
          // })}
        >
          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          {isRegistration && (
            <TextInput
              required
              label="Name"
              placeholder="Doug Smith"
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
          )}
          <PasswordInput
            required
            label="Password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      </Modal>
      <Group justify="space-between" align="center" h="100%" p={5}>
        <ReactSVG src={TickrLogo} id="logo" className={computedColorScheme} />
        <Group>
          {user && (
            <>
              <Text>{user.name}: </Text>
              <Dollars value={user.balance} />
              {portfolioValue && (
                <>
                  <Dollars value={portfolioValue.value} />
                  <Gain
                    change={portfolioValue.change}
                    changePercent={portfolioValue.changePercent}
                  />
                </>
              )}
              <Button
                onClick={() => {
                  void logout();
                }}
              >
                Logout
              </Button>
            </>
          )}
          {!user && (
            <div>
              <Button onClick={onRegisterClick}>Register</Button>
              <Button onClick={onLoginClick} ml={5}>
                Login
              </Button>
            </div>
          )}
          <ActionIcon
            onClick={() => {
              setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
            }}
          >
            {computedColorScheme === "dark" && <TbSunHigh />}
            {computedColorScheme === "light" && <TbMoon />}
          </ActionIcon>
        </Group>
      </Group>
    </>
  );
}

export default Header;
